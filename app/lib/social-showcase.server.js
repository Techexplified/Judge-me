import db from "../db.server.js";
import { attachPublicMediaUrls } from "./review-media.server.js";
import { REVIEW_LIST_SELECT } from "./review-query.shared.js";
import { mergeFormConfig } from "./review-form-config.shared.js";
import {
  mergeSocialShowcaseConfig,
  parseSocialShowcaseConfigPayload,
  pickSocialShowcaseConfigForSave,
  pruneSocialShowcaseSelections,
} from "./social-showcase-config.shared.js";
import { normalizeBrandLogoUrl } from "./shop-assets.server.js";

const PUBLISHED_STATUSES = ["PUBLISHED", "APPROVED"];

function parseStoredConfig(row) {
  if (!row?.config) return {};
  try {
    return JSON.parse(row.config);
  } catch {
    return {};
  }
}

export function buildSocialShowcaseShareUrl(shop) {
  return `https://${shop}/apps/judgeme-reviews/social-showcase`;
}

function formatShopDisplayName(shop) {
  const handle = String(shop || "")
    .replace(/\.myshopify\.com$/i, "")
    .trim();
  if (!handle) return "Store";
  return handle
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildConfigDefaults(stored) {
  const formConfig = mergeFormConfig(stored);
  return {
    storeName: stored.storeProfile?.storeName?.trim() || "",
    accentColor:
      stored.onboarding?.appearance?.accentColor ||
      formConfig.accentColor ||
      formConfig.primaryColor ||
      "",
    brandLogoUrl: normalizeBrandLogoUrl(
      formConfig.brandLogoUrl || stored.brandLogoUrl || null,
    ),
  };
}

function computeSummary(reviews) {
  const total = reviews.length;
  if (total === 0) {
    return { average: 0, total: 0 };
  }
  let sum = 0;
  for (const r of reviews) {
    sum += Math.min(5, Math.max(1, Number(r.rating) || 0));
  }
  return {
    average: Math.round((sum / total) * 10) / 10,
    total,
  };
}

async function loadPublishedReviews(shop, request) {
  const reviews = await db.review.findMany({
    where: {
      shop,
      status: { in: PUBLISHED_STATUSES },
    },
    orderBy: { createdAt: "desc" },
    select: REVIEW_LIST_SELECT,
  });
  return attachPublicMediaUrls(request, reviews);
}

function flattenPhotoCandidates(reviews) {
  const photos = [];
  for (const review of reviews) {
    for (const media of review.media || []) {
      if (media.type !== "image") continue;
      photos.push({
        id: media.id,
        url: media.url,
        rating: review.rating,
        reviewId: review.id,
        author: review.author,
      });
    }
  }
  return photos;
}

function formatReviewDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function serializeShowcaseReview(review) {
  return {
    id: review.id,
    author: review.author,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    productName: review.productName,
    productImage: review.productImage,
    createdAt: review.createdAt,
    formattedDate: formatReviewDate(review.createdAt),
    media: review.media || [],
  };
}

export async function loadSocialShowcaseAdminData({ shop, request }) {
  const row = await db.settings.findUnique({ where: { shop } });
  const stored = parseStoredConfig(row);
  const defaults = buildConfigDefaults(stored);
  const allReviews = await loadPublishedReviews(shop, request);
  const photoCandidates = flattenPhotoCandidates(allReviews);
  const validReviewIds = allReviews.map((r) => r.id);
  const validMediaIds = photoCandidates.map((p) => p.id);

  let config = mergeSocialShowcaseConfig(stored, {
    storeName: defaults.storeName || formatShopDisplayName(shop),
    accentColor: defaults.accentColor,
  });
  config = pruneSocialShowcaseSelections(config, { validReviewIds, validMediaIds });

  const summary = computeSummary(allReviews);

  return {
    config,
    brandLogoUrl: defaults.brandLogoUrl,
    shareUrl: buildSocialShowcaseShareUrl(shop),
    shopUrl: `https://${shop}`,
    reviewCandidates: allReviews.map(serializeShowcaseReview),
    photoCandidates,
    summary,
  };
}

export async function saveSocialShowcaseConfig({ shop, payload }) {
  const row = await db.settings.findUnique({ where: { shop } });
  const stored = parseStoredConfig(row);
  const normalized = pickSocialShowcaseConfigForSave(parseSocialShowcaseConfigPayload(payload));

  const allReviews = await db.review.findMany({
    where: { shop, status: { in: PUBLISHED_STATUSES } },
    select: {
      id: true,
      media: { where: { type: "image" }, select: { id: true } },
    },
  });
  const validReviewIds = allReviews.map((r) => r.id);
  const validMediaIds = allReviews.flatMap((r) => r.media.map((m) => m.id));
  const pruned = pruneSocialShowcaseSelections(normalized, { validReviewIds, validMediaIds });

  const merged = {
    ...stored,
    socialShowcase: pruned,
    socialShowcaseUpdatedAt: new Date().toISOString(),
  };

  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(merged) },
    create: { shop, config: JSON.stringify(merged) },
  });

  return { ok: true, config: pruned };
}

export async function resolveSocialShowcasePublicData({ shop, request }) {
  const row = await db.settings.findUnique({ where: { shop } });
  const stored = parseStoredConfig(row);
  const defaults = buildConfigDefaults(stored);
  const allReviews = await loadPublishedReviews(shop, request);
  const validReviewIds = allReviews.map((r) => r.id);
  const photoCandidates = flattenPhotoCandidates(allReviews);
  const validMediaIds = photoCandidates.map((p) => p.id);

  let config = mergeSocialShowcaseConfig(stored, {
    storeName: defaults.storeName || formatShopDisplayName(shop),
    accentColor: defaults.accentColor,
  });
  config = pruneSocialShowcaseSelections(config, { validReviewIds, validMediaIds });

  const reviewMap = new Map(allReviews.map((r) => [r.id, r]));
  const photoMap = new Map(photoCandidates.map((p) => [p.id, p]));

  const selectedReviews = config.selectedReviewIds
    .map((id) => reviewMap.get(id))
    .filter(Boolean)
    .map(serializeShowcaseReview);

  const selectedPhotos = config.selectedMediaIds
    .map((id) => photoMap.get(id))
    .filter(Boolean);

  const summary = computeSummary(allReviews);

  let hideVerdictBranding = mergeFormConfig(stored).hideVerdictBranding === true;
  if (hideVerdictBranding) {
    try {
      const { getShopPlanStatus } = await import("./billing.server.js");
      const planStatus = await getShopPlanStatus(shop);
      if (!planStatus.hasPro) hideVerdictBranding = false;
    } catch {
      hideVerdictBranding = false;
    }
  }

  return {
    config,
    brandLogoUrl: defaults.brandLogoUrl,
    hideVerdictBranding,
    shopUrl: `https://${shop}`,
    selectedReviews,
    selectedPhotos,
    summary,
  };
}

export async function toggleShowcaseReview({ shop, reviewId, selected }) {
  const row = await db.settings.findUnique({ where: { shop } });
  const stored = parseStoredConfig(row);
  const defaults = buildConfigDefaults(stored);
  let config = mergeSocialShowcaseConfig(stored, {
    storeName: defaults.storeName || formatShopDisplayName(shop),
    accentColor: defaults.accentColor,
  });

  const id = String(reviewId || "").trim();
  if (!id) return { ok: false, error: "Missing review ID" };

  const ids = new Set(config.selectedReviewIds);
  if (selected) {
    if (!ids.has(id) && ids.size >= 5) {
      return { ok: false, error: "You can showcase up to 5 reviews." };
    }
    ids.add(id);
  } else {
    ids.delete(id);
  }

  config = { ...config, selectedReviewIds: [...ids] };
  return saveSocialShowcaseConfig({ shop, payload: config });
}

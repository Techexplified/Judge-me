import db from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.js";
import { getGroupShopList } from "../lib/store-group.server.js";
import { REVIEW_LIST_SELECT } from "../lib/review-query.shared.js";
import {
  computeDashboardMetrics,
  parseDashboardRange,
  rangeStartFromKey,
} from "./dashboard-metrics.server.js";
import {
  syncExistingReviews,
  hasRunInitialSync,
  markInitialSyncDone,
} from "../lib/review-sync.server.js";
import {
  syncProductIndex,
  hasRunProductIndexSync,
  markProductIndexSyncDone,
} from "../lib/product-index.server.js";
import { loadOnsiteWidgetMetrics } from "../lib/collect-reviews.server.js";

const STORE_REVIEW_PRODUCT_IDS = new Set(["store", "shop", "store-review"]);

export function isStoreReview(review) {
  const pid = String(review.productId ?? "").trim().toLowerCase();
  if (STORE_REVIEW_PRODUCT_IDS.has(pid)) return true;
  const name = String(review.productName ?? "").trim().toLowerCase();
  return name === "store review" || name === "store reviews";
}

function slugifyHandle(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeProductIdKey(id) {
  const raw = String(id ?? "").trim();
  if (!raw) return "";
  const numeric = raw.replace(/\D/g, "");
  return numeric || raw.toLowerCase();
}

function looksLikeSlug(name) {
  const s = String(name ?? "").trim();
  if (!s) return true;
  if (s.includes(" ")) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/i.test(s);
}

function titleFromSlug(slug) {
  return String(slug ?? "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function pickBestProductName(candidates, indexTitle, handle) {
  const titled = candidates
    .map((n) => String(n ?? "").trim())
    .filter(Boolean)
    .filter((n) => !looksLikeSlug(n));
  if (indexTitle?.trim()) return indexTitle.trim();
  if (titled.length) return titled[0];
  if (handle?.trim()) return titleFromSlug(handle);
  const slug = candidates.find(Boolean);
  return slug ? titleFromSlug(slug) : "Unknown product";
}

function buildProductIndexLookup(rows) {
  const byId = new Map();
  for (const row of rows) {
    byId.set(String(row.productId), row);
    const numeric = normalizeProductIdKey(row.productId);
    if (numeric) byId.set(numeric, row);
    if (row.handle) byId.set(`handle:${row.handle.toLowerCase()}`, row);
  }
  return byId;
}

function resolveProductIndex(byId, productId, productName) {
  const pid = String(productId ?? "").trim();
  if (pid && byId.has(pid)) return byId.get(pid);
  const numeric = normalizeProductIdKey(pid);
  if (numeric && byId.has(numeric)) return byId.get(numeric);
  const handleKey = `handle:${slugifyHandle(productName)}`;
  if (byId.has(handleKey)) return byId.get(handleKey);
  return null;
}

function sentimentFromAvg(avg) {
  if (avg >= 4) return "Positive";
  if (avg < 3) return "Negative";
  return "Mixed";
}

function sentimentTone(label) {
  if (label === "Positive") return "positive";
  if (label === "Negative") return "negative";
  return "mixed";
}

async function readShopConfig(shop) {
  const row = await db.settings.findUnique({ where: { shop } });
  if (!row?.config) return {};
  try {
    return JSON.parse(row.config);
  } catch {
    return {};
  }
}

export async function loadPerformanceOverviewData({ request, session, admin }) {
  const normalizedShop = normalizeShopDomain(session.shop);

  const storedConfig = await readShopConfig(normalizedShop);

  try {
    const alreadySynced = await hasRunInitialSync(normalizedShop, storedConfig);
    if (!alreadySynced) {
      syncExistingReviews(admin, normalizedShop)
        .then(() => markInitialSyncDone(normalizedShop))
        .catch((err) => console.error("[review-sync] error:", err));
    }
  } catch (syncErr) {
    console.error("[review-sync] check failed:", syncErr);
  }

  try {
    const indexSynced = await hasRunProductIndexSync(normalizedShop, storedConfig);
    if (!indexSynced) {
      syncProductIndex(admin, normalizedShop)
        .then(() => markProductIndexSyncDone(normalizedShop))
        .catch((err) => console.error("[product-index] error:", err));
    }
  } catch (indexErr) {
    console.error("[product-index] check failed:", indexErr);
  }

  const url = new URL(request.url);
  const rangeKey = parseDashboardRange(url.searchParams);
  const fromOnboarding = url.searchParams.get("fromOnboarding") === "1";

  const targetShops = await getGroupShopList(normalizedShop);
  const reviewsAll = await db.review.findMany({
    where: { shop: { in: targetShops } },
    orderBy: { createdAt: "desc" },
    select: REVIEW_LIST_SELECT,
  });

  const productReviews = reviewsAll.filter((r) => !isStoreReview(r));
  const now = new Date();

  const allTimeMetrics = computeDashboardMetrics({
    shop: normalizedShop,
    scopedReviews: productReviews,
    reviewsAll: productReviews,
    now,
    rangeKey: "all",
  });

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const collectedThisMonth = productReviews.filter(
    (r) => new Date(r.createdAt) >= firstDayOfMonth,
  ).length;

  const sevenAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const collectedThisWeek = productReviews.filter(
    (r) => new Date(r.createdAt) >= sevenAgo,
  ).length;

  const onsite = await loadOnsiteWidgetMetrics(normalizedShop);
  const storefrontCollection = {
    enabled: onsite.enabled !== false,
    statusLabel: onsite.enabled !== false ? "Active" : "Paused",
    widgetViews: onsite.metrics.widgetViews,
    widgetViewsTrend: onsite.metrics.widgetViewsTrend,
    conversionRate: onsite.metrics.conversionRate,
    conversionTrend: onsite.metrics.conversionTrend,
    reviewsCollected: onsite.metrics.reviewsCollected,
    reviewsCollectedTrend: onsite.metrics.reviewsCollectedTrend,
  };

  const appRatingBanner = storedConfig.appRatingBanner ?? {};
  const showRatingBanner =
    fromOnboarding &&
    !appRatingBanner.dismissed &&
    !appRatingBanner.rated;

  const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return {
    shop: normalizedShop,
    rangeKey,
    fromOnboarding,
    showRatingBanner,
    monthLabel,
    reviews: {
      totalReviews: Number(allTimeMetrics.kpis.totalReviews),
      totalTrend: allTimeMetrics.kpis.totalTrend,
      avgRating: allTimeMetrics.kpis.avgRating,
      collectedThisMonth,
      collectedThisWeek,
      active: productReviews.length > 0,
    },
    storefrontCollection,
  };
}

export async function loadManageReviewsData({ request, session, admin }) {
  const normalizedShop = normalizeShopDomain(session.shop);
  const targetShops = await getGroupShopList(normalizedShop);

  const reviewsAll = await db.review.findMany({
    where: { shop: { in: targetShops } },
    orderBy: { createdAt: "desc" },
    select: REVIEW_LIST_SELECT,
  });

  const productIndexRows = await db.productIndex.findMany({
    where: { shop: { in: targetShops } },
    select: { shop: true, productId: true, handle: true, title: true },
  });

  const productById = buildProductIndexLookup(productIndexRows);

  const productReviews = reviewsAll.filter((r) => !isStoreReview(r));
  const storeReviews = reviewsAll.filter((r) => isStoreReview(r));

  const grouped = {};
  for (const review of productReviews) {
    const indexRow = resolveProductIndex(
      productById,
      review.productId,
      review.productName,
    );
    const handle =
      indexRow?.handle ||
      (looksLikeSlug(review.productName) ? slugifyHandle(review.productName) : slugifyHandle(review.productName));
    const key =
      normalizeProductIdKey(review.productId) ||
      `handle:${handle}` ||
      slugifyHandle(review.productName) ||
      "unknown";

    if (!grouped[key]) {
      grouped[key] = {
        productId: review.productId ?? null,
        productName: review.productName || indexRow?.title || "Unknown product",
        productImage: review.productImage ?? null,
        nameCandidates: [],
        indexTitle: indexRow?.title ?? null,
        handle,
        reviews: [],
        totalRating: 0,
      };
    }

    const group = grouped[key];
    if (review.productName) group.nameCandidates.push(review.productName);
    if (indexRow?.title) group.indexTitle = indexRow.title;
    if (indexRow?.handle) group.handle = indexRow.handle;
    if (!group.productId && review.productId) group.productId = review.productId;
    if (!group.productImage && review.productImage) group.productImage = review.productImage;
    group.reviews.push(review);
    group.totalRating += Number(review.rating) || 0;
  }

  const missingIds = [
    ...new Set(
      Object.values(grouped)
        .filter((g) => !g.indexTitle && g.productId)
        .map((g) => {
          const pid = String(g.productId);
          return pid.startsWith("gid://") ? pid : `gid://shopify/Product/${normalizeProductIdKey(pid)}`;
        })
        .filter((id) => normalizeProductIdKey(id)),
    ),
  ];

  if (admin && missingIds.length) {
    try {
      const chunks = [];
      for (let i = 0; i < missingIds.length; i += 50) {
        chunks.push(missingIds.slice(i, i + 50));
      }
      for (const ids of chunks) {
        const res = await admin.graphql(
          `#graphql
          query ManageReviewsProductTitles($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                title
                handle
                featuredImage { url }
              }
            }
          }`,
          { variables: { ids } },
        );
        const json = await res.json();
        for (const node of json?.data?.nodes ?? []) {
          if (!node?.id) continue;
          const numeric = normalizeProductIdKey(node.id);
          productById.set(String(node.id), {
            productId: node.id,
            title: node.title,
            handle: node.handle,
          });
          if (numeric) productById.set(numeric, productById.get(String(node.id)));

          for (const group of Object.values(grouped)) {
            if (normalizeProductIdKey(group.productId) === numeric) {
              group.indexTitle = node.title;
              group.handle = node.handle || group.handle;
              if (!group.productImage && node.featuredImage?.url) {
                group.productImage = node.featuredImage.url;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[manage-reviews] product title lookup failed:", err);
    }
  }

  const url = new URL(request.url);
  const rangeKey = parseDashboardRange(url.searchParams);
  const rangeStart = rangeStartFromKey(new Date(), rangeKey);

  const products = Object.values(grouped).map((p) => {
    const sorted = [...p.reviews].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    const inRange = rangeStart
      ? sorted.filter((r) => new Date(r.createdAt) >= rangeStart)
      : sorted;
    const avg = p.reviews.length ? p.totalRating / p.reviews.length : 0;
    const sentiment = sentimentFromAvg(avg);
    const latest = sorted[0];
    const handle = p.handle || slugifyHandle(p.productName);
    const displayName = pickBestProductName(
      [p.indexTitle, ...p.nameCandidates, p.productName],
      p.indexTitle,
      handle,
    );

    return {
      productId: p.productId,
      productName: displayName,
      productImage: p.productImage,
      handle,
      avgRating: avg.toFixed(1),
      reviewCount: p.reviews.length,
      inRangeCount: inRange.length,
      sentiment,
      sentimentTone: sentimentTone(sentiment),
      lastReview: latest
        ? new Date(latest.createdAt).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
          })
        : "—",
      lastReviewAt: latest?.createdAt ?? null,
    };
  });

  const storeReviewLink = `https://${normalizedShop}/apps/judgeme-reviews/store-review`;

  return {
    shop: normalizedShop,
    rangeKey,
    products,
    storeReviews,
    storeReviewLink,
    productReviewCount: productReviews.length,
  };
}

export async function dismissAppRatingBanner(shop) {
  const normalized = normalizeShopDomain(shop);
  const config = await readShopConfig(normalized);
  config.appRatingBanner = {
    ...(config.appRatingBanner ?? {}),
    dismissed: true,
    dismissedAt: new Date().toISOString(),
  };
  await db.settings.upsert({
    where: { shop: normalized },
    update: { config: JSON.stringify(config) },
    create: { shop: normalized, config: JSON.stringify(config) },
  });
}

export async function markAppRatingSubmitted(shop) {
  const normalized = normalizeShopDomain(shop);
  const config = await readShopConfig(normalized);
  config.appRatingBanner = {
    ...(config.appRatingBanner ?? {}),
    rated: true,
    ratedAt: new Date().toISOString(),
  };
  await db.settings.upsert({
    where: { shop: normalized },
    update: { config: JSON.stringify(config) },
    create: { shop: normalized, config: JSON.stringify(config) },
  });
}

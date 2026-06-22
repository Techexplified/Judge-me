import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { getGroupShopList } from "../lib/store-group.server.js";
import { getResolvedOpenRouterKey } from "../lib/openrouter.server.js";
import { hasProAccess, serializePlanStatus } from "../lib/billing.server.js";
import { REVIEW_LIST_SELECT } from "../lib/review-query.shared.js";
import { getTranslationSettings } from "../lib/review-translation.shared.js";
import { isStoreReview } from "../utils/performance-metrics.server.js";
import {
  isStoreReviewProduct,
  normalizeProductLookup,
  resolveProductFromUrlParams,
} from "./reviews-management.shared.js";

function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return (((current - previous) / previous) * 100).toFixed(1);
}

export { normalizeProductLookup, resolveProductFromUrlParams, isStoreReviewProduct };

export async function loadReviewsManagementData({ request, session, billing }) {
  const shop = normalizeShopDomain(session.shop);
  const { getShopPlanStatus } = await import("../lib/billing.server.js");
  const targetShops = await getGroupShopList(shop);

  const reviewsRaw = await db.review.findMany({
    where: { shop: { in: targetShops } },
    orderBy: { createdAt: "desc" },
    select: REVIEW_LIST_SELECT,
  });

  const { attachPublicMediaUrls } = await import("../lib/review-media.server.js");
  const reviews = attachPublicMediaUrls(request, reviewsRaw);

  const productReviews = reviews.filter((r) => !isStoreReview(r));
  const storeReviews = reviews.filter((r) => isStoreReview(r));

  const totalReviews = productReviews.length;
  const avgRating =
    totalReviews > 0
      ? (productReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : "0.0";

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const reviewsThisMonth = productReviews.filter(
    (r) => new Date(r.createdAt) >= firstDayOfMonth,
  ).length;
  const reviewsLastMonth = productReviews.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= firstDayOfLastMonth && d < firstDayOfMonth;
  }).length;

  const grouped = productReviews.reduce((acc, review) => {
    const key = review.productName || review.productId || "Unknown";
    if (!acc[key]) {
      acc[key] = {
        productName: key,
        productImage: review.productImage,
        reviews: [],
        totalRating: 0,
      };
    } else if (!acc[key].productImage && review.productImage) {
      acc[key].productImage = review.productImage;
    }
    acc[key].reviews.push(review);
    acc[key].totalRating += review.rating;
    return acc;
  }, {});

  for (const p of Object.values(grouped)) {
    p.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const products = Object.values(grouped).map((p) => ({
    ...p,
    avgRating: (p.totalRating / p.reviews.length).toFixed(1),
    reviewCount: p.reviews.length,
    latestDate: p.reviews[0].createdAt,
  }));

  const planStatus = await getShopPlanStatus(shop, billing);
  const premium = hasProAccess(planStatus);
  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (settingsRow?.config) {
    try {
      config = JSON.parse(settingsRow.config);
    } catch {
      config = {};
    }
  }
  const translation = getTranslationSettings(config);

  return {
    products,
    storeReviews,
    storeReviewLink: `https://${shop}/apps/judgeme-reviews/store-review`,
    currentShop: shop,
    translation,
    premium,
    aiAvailable: premium && Boolean(getResolvedOpenRouterKey()),
    planStatus: serializePlanStatus(planStatus),
    trialStatus: serializePlanStatus(planStatus),
    stats: {
      totalReviews,
      avgRating,
      reviewsThisMonth,
      reviewsGrowth: calculateGrowth(reviewsThisMonth, reviewsLastMonth),
      totalGrowth: calculateGrowth(reviewsThisMonth, reviewsLastMonth),
    },
  };
}

export async function handleReviewsManagementAction(requestOrCtx) {
  try {
    let session;
    let formData;

    if (requestOrCtx && typeof requestOrCtx.formData === "function") {
      ({ session } = await authenticate.admin(requestOrCtx));
      formData = await requestOrCtx.formData();
    } else {
      session = requestOrCtx.session;
      formData = requestOrCtx.formData;
    }

    if (!session || !formData) {
      return { ok: false, error: "Invalid review action request." };
    }

  const shop = normalizeShopDomain(session.shop);
  const intent = formData.get("_intent");
  const reviewId = formData.get("reviewId");

  const settingsRow = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (settingsRow?.config) {
    try {
      config = JSON.parse(settingsRow.config);
    } catch {
      config = {};
    }
  }
  const translation = getTranslationSettings(config);

  if (intent === "translateReview") {
    const { getShopPlanStatus, requireFeatureUsage } = await import("../lib/billing.server.js");
    const planStatus = await getShopPlanStatus(shop);
    const usageCheck = await requireFeatureUsage(planStatus, "auto_translate");
    if (!usageCheck.ok) {
      return { ok: false, error: usageCheck.message || "Pro plan required for review translation." };
    }
    const apiKey = getResolvedOpenRouterKey();
    if (!apiKey) {
      return { ok: false, error: "Translation service is temporarily unavailable." };
    }
    if (!reviewId || typeof reviewId !== "string") {
      return { ok: false, error: "Missing review." };
    }

    const targetShops = await getGroupShopList(shop);
    const existing = await db.review.findFirst({
      where: { id: reviewId, shop: { in: targetShops } },
    });
    if (!existing) {
      return { ok: false, error: "Review not found." };
    }

    const { translateSingleReview } = await import("../lib/review-translation.server.js");
    const result = await translateSingleReview(
      reviewId,
      existing.shop,
      translation.targetLanguage,
      apiKey,
      translation.sourceLanguage,
    );

    if (!result.ok) {
      return { ok: false, error: result.error || "Translation failed." };
    }

    return {
      ok: true,
      intent: "translateReview",
      reviewId,
      unchanged: result.unchanged,
      review: {
        id: result.review.id,
        title: result.review.title,
        comment: result.review.comment,
        originalTitle: result.review.originalTitle,
        originalComment: result.review.originalComment,
        translatedLang: result.review.translatedLang,
      },
    };
  }

  if (intent === "suggestReply") {
    const { getShopPlanStatus, requireFeatureUsage } = await import("../lib/billing.server.js");
    const { generateReviewReply } = await import("../lib/openrouter.server.js");
    const planStatus = await getShopPlanStatus(shop);
    const usageCheck = await requireFeatureUsage(planStatus, "ai_review_replies");
    if (!usageCheck.ok) {
      return { ok: false, intent: "suggestReply", error: usageCheck.message };
    }

    const apiKey = getResolvedOpenRouterKey();
    if (!apiKey) {
      return { ok: false, intent: "suggestReply", error: "AI service is temporarily unavailable." };
    }

    if (!reviewId || typeof reviewId !== "string") {
      return { ok: false, intent: "suggestReply", error: "Missing review." };
    }

    const targetShops = await getGroupShopList(shop);
    const existing = await db.review.findFirst({
      where: { id: reviewId, shop: { in: targetShops } },
    });
    if (!existing) {
      return { ok: false, intent: "suggestReply", error: "Review not found." };
    }

    const draftReply = formData.get("draftReply");
    const { reply, error } = await generateReviewReply({
      apiKey,
      review: {
        rating: existing.rating,
        comment: existing.comment,
        title: existing.title,
        author: existing.author,
        productName: existing.productName,
      },
      existingReply: typeof draftReply === "string" ? draftReply : null,
    });

    if (error) {
      return { ok: false, intent: "suggestReply", error };
    }

    return { ok: true, intent: "suggestReply", reviewId, suggestedReply: reply };
  }

  if (intent === "translateReviews") {
    const { getShopPlanStatus, requireFeatureUsage, hasProAccess } = await import(
      "../lib/billing.server.js"
    );
    const planStatus = await getShopPlanStatus(shop);
    if (!hasProAccess(planStatus)) {
      return {
        ok: false,
        error:
          "Bulk translation requires Pro. On Free, translate individual reviews while replying (10/month).",
      };
    }
    const apiKey = getResolvedOpenRouterKey();
    if (!apiKey) {
      return { ok: false, error: "Translation service is temporarily unavailable." };
    }

    const rawIds = String(formData.get("reviewIds") || "");
    const reviewIds = rawIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (reviewIds.length === 0) {
      return { ok: false, error: "Select at least one review." };
    }

    const usageCheck = await requireFeatureUsage(planStatus, "auto_translate", reviewIds.length);
    if (!usageCheck.ok) {
      return { ok: false, error: usageCheck.message || "Pro plan required for review translation." };
    }

    const { translateReviewIds } = await import("../lib/review-translation.server.js");
    const result = await translateReviewIds(
      shop,
      reviewIds,
      translation.targetLanguage,
      apiKey,
      translation.sourceLanguage,
    );

    if (result.errors?.length) {
      return { ok: false, error: result.errors[0] };
    }

    return {
      ok: true,
      intent: "translateReviews",
      translated: result.translated,
      skipped: result.skipped,
      reviewIds,
    };
  }

  const reply = formData.get("reply");

  if (!reviewId || typeof reply !== "string") {
    return { ok: false, error: "Missing review or reply." };
  }

  const trimmed = reply.trim();
  if (!trimmed) {
    return { ok: false, error: "Reply cannot be empty." };
  }

  const targetShops = await getGroupShopList(shop);
  const existing = await db.review.findFirst({
    where: { id: reviewId, shop: { in: targetShops } },
  });
  if (!existing) {
    return { ok: false, error: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { reply: trimmed, replyDate: new Date() },
  });
  return { ok: true, reviewId, reply: trimmed };
  } catch (error) {
    console.error("[reviews-management] action failed:", error);
    return {
      ok: false,
      error: "Something went wrong. Please try again in a moment.",
    };
  }
}

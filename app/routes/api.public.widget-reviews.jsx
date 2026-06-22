import db from "../db.server";
import { getActiveTranslationContext, storefrontReviewText } from "../lib/review-translation.server.js";
import { attachPublicMediaUrls } from "../lib/review-media.server.js";
import { isStoreReview } from "../utils/performance-metrics.server.js";
import { normalizeShopDomain } from "../utils/shop.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PUBLISHED_STATUSES = ["PUBLISHED", "APPROVED"];

function computeSummary(reviews) {
  const total = reviews.length;
  if (total === 0) {
    return {
      average: 0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  for (const r of reviews) {
    const rating = Math.min(5, Math.max(1, Number(r.rating) || 0));
    if (rating >= 1 && rating <= 5) distribution[rating] += 1;
    sum += rating;
  }
  return {
    average: Math.round((sum / total) * 10) / 10,
    total,
    distribution,
  };
}

function filterByMedia(reviews, media) {
  if (media === "video") {
    return reviews.filter((r) => (r.media || []).some((m) => m.type === "video"));
  }
  if (media === "photo") {
    return reviews.filter((r) => (r.media || []).some((m) => m.type === "image"));
  }
  return reviews;
}

function filterByScope(reviews, scope, productId) {
  if (scope === "store") {
    return reviews.filter((r) => isStoreReview(r));
  }
  if (scope === "product" && productId) {
    const pid = String(productId).trim();
    return reviews.filter((r) => !isStoreReview(r) && String(r.productId) === pid);
  }
  if (scope === "product") {
    return reviews.filter((r) => !isStoreReview(r));
  }
  return reviews;
}

function serializeReview(r, active, translation) {
  const text = storefrontReviewText(r, active, translation.targetLanguage);
  return {
    id: r.id,
    shop: r.shop,
    productId: r.productId,
    productName: r.productName,
    productImage: r.productImage,
    rating: r.rating,
    title: text.title,
    comment: text.comment,
    author: r.author,
    status: r.status,
    reply: r.reply,
    replyDate: r.replyDate,
    createdAt: r.createdAt,
    media: r.media,
    isStoreReview: isStoreReview(r),
  };
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const shopRaw = url.searchParams.get("shop");
  if (!shopRaw) {
    return new Response(JSON.stringify({ error: "Missing shop" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const shopNorm = normalizeShopDomain(shopRaw);
  const scope = url.searchParams.get("scope") || "shop";
  const productId = url.searchParams.get("productId");
  const media = url.searchParams.get("media") || "all";
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

  const allReviews = await db.review.findMany({
    where: {
      shop: shopNorm,
      status: { in: PUBLISHED_STATUSES },
    },
    orderBy: { createdAt: "desc" },
    include: {
      media: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          type: true,
          mimeType: true,
          filename: true,
        },
      },
    },
  });

  const scoped = filterByScope(allReviews, scope, productId);
  const withMediaFilter = filterByMedia(scoped, media);
  const summary = computeSummary(scoped);

  const filters = {
    all: scoped.length,
    photos: filterByMedia(scoped, "photo").length,
    videos: filterByMedia(scoped, "video").length,
    product: filterByScope(allReviews, "product").length,
    store: filterByScope(allReviews, "store").length,
  };

  const page = withMediaFilter.slice(offset, offset + limit);
  const withUrls = attachPublicMediaUrls(request, page);

  const { active, translation } = await getActiveTranslationContext(shopNorm);
  const reviews = withUrls.map((r) => serializeReview(r, active, translation));

  return new Response(
    JSON.stringify({
      reviews,
      summary,
      filters,
      pagination: {
        offset,
        limit,
        total: withMediaFilter.length,
        hasMore: offset + limit < withMediaFilter.length,
      },
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

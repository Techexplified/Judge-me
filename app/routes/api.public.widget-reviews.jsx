import db from "../db.server";
import { getActiveTranslationContext, storefrontReviewText } from "../lib/review-translation.server.js";
import { attachPublicMediaUrls } from "../lib/review-media.server.js";
import {
  getPublicCache,
  publicCacheHeaders,
  publicCacheKey,
  setPublicCache,
} from "../lib/public-cache.server.js";
import { productIdMatchList } from "../utils/product-id.server.js";
import { normalizeShopDomain } from "../utils/shop.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PUBLISHED_STATUSES = ["PUBLISHED", "APPROVED"];
const STORE_REVIEW_PRODUCT_IDS = ["store", "shop", "store-review"];

function storeReviewWhere() {
  return {
    OR: [
      { productId: { in: STORE_REVIEW_PRODUCT_IDS } },
      { productName: { equals: "store review", mode: "insensitive" } },
      { productName: { equals: "store reviews", mode: "insensitive" } },
    ],
  };
}

function productReviewWhere(productId) {
  if (productId) {
    const ids = productIdMatchList(productId);
    return ids.length
      ? { productId: { in: ids }, NOT: storeReviewWhere() }
      : { productId: "__never_match__", NOT: storeReviewWhere() };
  }
  return { NOT: storeReviewWhere() };
}

function scopeWhere(scope, productId) {
  if (scope === "store") return storeReviewWhere();
  if (scope === "product") return productReviewWhere(productId);
  return {};
}

function mediaWhere(media) {
  if (media === "video") return { media: { some: { type: "video" } } };
  if (media === "photo") return { media: { some: { type: "image" } } };
  return {};
}

function combineWhere(...parts) {
  const cleaned = parts.filter((part) => part && Object.keys(part).length > 0);
  if (cleaned.length === 0) return {};
  if (cleaned.length === 1) return cleaned[0];
  return { AND: cleaned };
}

function computeSummary(total, average, ratingGroups) {
  if (total === 0) {
    return {
      average: 0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const group of ratingGroups) {
    const rating = Math.min(5, Math.max(1, Number(group.rating) || 0));
    if (rating >= 1 && rating <= 5) distribution[rating] += Number(group.count) || 0;
  }
  return {
    average: Math.round((Number(average) || 0) * 10) / 10,
    total,
    distribution,
  };
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
    isStoreReview: STORE_REVIEW_PRODUCT_IDS.includes(String(r.productId ?? "").toLowerCase()),
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
  const cacheKey = publicCacheKey(request, "widget-reviews");
  const cached = getPublicCache(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        ...corsHeaders,
        ...publicCacheHeaders(true),
        "Content-Type": "application/json",
      },
    });
  }

  try {
  const scope = url.searchParams.get("scope") || "shop";
  const productId = url.searchParams.get("productId");
  const media = url.searchParams.get("media") || "all";
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  // lite=1 skips filter/summary counts (video slider / testimonials) — fewer DB ops + smaller JSON.
  const lite = url.searchParams.get("lite") === "1" || url.searchParams.get("lite") === "true";

  const baseWhere = { shop: shopNorm, status: { in: PUBLISHED_STATUSES } };
  const scopedWhere = combineWhere(baseWhere, scopeWhere(scope, productId));
  const pagedWhere = combineWhere(scopedWhere, mediaWhere(media));

  let page;
  let filteredTotal;
  let summary;
  let filters;

  if (lite) {
    const [pageRows, total] = await Promise.all([
      db.review.findMany({
        where: pagedWhere,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
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
      }),
      db.review.count({ where: pagedWhere }),
    ]);
    page = pageRows;
    filteredTotal = total;
    summary = { average: 0, total, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    filters = { all: total, photos: 0, videos: 0, product: 0, store: 0 };
  } else {
    const [
      pageRows,
      total,
      aggregate,
      ratingGroups,
      photoCount,
      videoCount,
      productCount,
      storeCount,
    ] = await Promise.all([
      db.review.findMany({
        where: pagedWhere,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
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
      }),
      db.review.count({ where: pagedWhere }),
      db.review.aggregate({
        where: scopedWhere,
        _count: { _all: true },
        _avg: { rating: true },
      }),
      db.review.groupBy({
        by: ["rating"],
        where: scopedWhere,
        _count: { _all: true },
      }),
      db.review.count({ where: combineWhere(scopedWhere, mediaWhere("photo")) }),
      db.review.count({ where: combineWhere(scopedWhere, mediaWhere("video")) }),
      db.review.count({ where: combineWhere(baseWhere, productReviewWhere()) }),
      db.review.count({ where: combineWhere(baseWhere, storeReviewWhere()) }),
    ]);
    page = pageRows;
    filteredTotal = total;
    summary = computeSummary(
      aggregate._count._all,
      aggregate._avg.rating,
      ratingGroups.map((group) => ({ rating: group.rating, count: group._count._all })),
    );
    filters = {
      all: summary.total,
      photos: photoCount,
      videos: videoCount,
      product: productCount,
      store: storeCount,
    };
  }

  const withUrls = attachPublicMediaUrls(request, page);

  const { active, translation } = await getActiveTranslationContext(shopNorm);
  const reviews = withUrls.map((r) => serializeReview(r, active, translation));

  const body = JSON.stringify({
      reviews,
      summary,
      filters,
      pagination: {
        offset,
        limit,
        total: filteredTotal,
        hasMore: offset + limit < filteredTotal,
      },
  });

  setPublicCache(cacheKey, body, {
    tags: [
      `reviews:${shopNorm}`,
      ...productIdMatchList(productId).map((id) => `reviews:${shopNorm}:product:${id}`),
    ],
  });

  return new Response(body, {
    headers: {
      ...corsHeaders,
      ...publicCacheHeaders(false),
      "Content-Type": "application/json",
    },
  });
  } catch (err) {
    console.error("[api.public.widget-reviews] loader failed:", err);
    return new Response(JSON.stringify({ error: "Could not load reviews" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

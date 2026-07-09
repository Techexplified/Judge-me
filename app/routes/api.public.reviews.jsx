import db from "../db.server";
import { emitReviewCollectedFlowTrigger } from "../lib/flow-review-trigger.server";
import {
  getPublicCache,
  invalidateShopReviewsCache,
  publicCacheHeaders,
  publicCacheKey,
  setPublicCache,
} from "../lib/public-cache.server.js";
import {
  getActiveTranslationContext,
  storefrontReviewText,
  maybeAutoTranslateReviewData,
} from "../lib/review-translation.server.js";
import {
  normalizeShopifyProductId,
  productIdMatchList,
} from "../utils/product-id.server";
import { normalizeShopDomain } from "../utils/shop.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PUBLISHED_STATUSES = ["PUBLISHED", "APPROVED"];

const PUBLIC_REVIEW_SELECT = {
  id: true,
  shop: true,
  productId: true,
  productName: true,
  productImage: true,
  rating: true,
  title: true,
  comment: true,
  author: true,
  status: true,
  reply: true,
  replyDate: true,
  originalComment: true,
  originalTitle: true,
  translatedLang: true,
  createdAt: true,
  media: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      mimeType: true,
      filename: true,
    },
  },
};

/** Non-blocking post-create work (translation + Flow). Never blocks the submit response. */
async function runPostReviewCreateTasks(shopNorm, created, reviewData) {
  try {
    const { data: translatedData } = await maybeAutoTranslateReviewData(shopNorm, reviewData);
    const translatedComment = translatedData?.comment ?? reviewData.comment;
    const translatedTitle = translatedData?.title ?? reviewData.title;
    const hasTranslation =
      translatedData?.originalComment ||
      translatedComment !== reviewData.comment ||
      (translatedTitle && translatedTitle !== reviewData.title);

    if (hasTranslation) {
      await db.review.update({
        where: { id: created.id },
        data: {
          originalComment: translatedData.originalComment ?? reviewData.comment,
          originalTitle: translatedData.originalTitle ?? reviewData.title ?? null,
          comment: translatedComment,
          title: translatedTitle ?? reviewData.title ?? null,
          translatedLang: translatedData.translatedLang ?? null,
        },
      });
      invalidateShopReviewsCache(shopNorm, [created.productId]);
    }
  } catch (err) {
    console.error("[api.public.reviews] post-create translate failed (non-fatal):", err);
  }

  try {
    await emitReviewCollectedFlowTrigger(shopNorm, created);
  } catch (err) {
    console.error("[api.public.reviews] post-create flow trigger failed (non-fatal):", err);
  }
}

/** Expand product IDs for Prisma `in` queries. */
function expandProductIds(ids) {
  const set = new Set();
  for (const id of ids) {
    if (!id) continue;
    set.add(id);
    const nid = normalizeShopifyProductId(id);
    if (nid) {
      set.add(nid);
      if (/^\d+$/.test(nid)) {
        set.add(`gid://shopify/Product/${nid}`);
      }
    }
  }
  return [...set];
}

/**
 * Build OR conditions for sister shops from ProductIndex matches.
 * @param {Array<{ shop: string, productId: string }>} matchingProducts
 */
function conditionsFromMatches(matchingProducts) {
  const matchMap = {};
  for (const p of matchingProducts) {
    if (!matchMap[p.shop]) matchMap[p.shop] = [];
    for (const id of expandProductIds([p.productId])) {
      matchMap[p.shop].push(id);
    }
  }
  return Object.entries(matchMap).map(([sisterShop, ids]) => ({
    shop: sisterShop,
    productId: { in: [...new Set(ids)] },
  }));
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

  if (!productId || !shop) {
    return new Response(JSON.stringify({ error: "Missing params" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
  const shopNorm = normalizeShopDomain(shop);
  const idVariants = productIdMatchList(productId);
  if (idVariants.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: {
        ...corsHeaders,
        ...publicCacheHeaders(false),
        "Content-Type": "application/json",
      },
    });
  }

  const cacheKey = publicCacheKey(request, "product-reviews");
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

  let targetQueryConditions = [
    { shop: shopNorm, productId: { in: idVariants } },
  ];

  try {
    const link = await db.groupStoreLink.findUnique({
      where: { shop: shopNorm },
      select: {
        group: {
          select: {
            members: { select: { shop: true } },
          },
        },
      },
    });

    if (link?.group) {
      const sisterShops = link.group.members
        .map((m) => normalizeShopDomain(m.shop))
        .filter((s) => s && s !== shopNorm);

      if (sisterShops.length > 0) {
        const productIndex = await db.productIndex.findFirst({
          where: { shop: shopNorm, productId: { in: idVariants } },
          select: { sku: true, handle: true },
        });

        let matchingProducts = [];

        if (productIndex?.sku) {
          matchingProducts = await db.productIndex.findMany({
            where: {
              shop: { in: sisterShops },
              sku: productIndex.sku,
            },
            select: { shop: true, productId: true },
          });
        } else if (productIndex?.handle) {
          matchingProducts = await db.productIndex.findMany({
            where: {
              shop: { in: sisterShops },
              handle: productIndex.handle,
            },
            select: { shop: true, productId: true },
          });
        }

        const sisterConditions = conditionsFromMatches(matchingProducts);
        targetQueryConditions = [...targetQueryConditions, ...sisterConditions];
      }
    }
  } catch (error) {
    console.error("[Syndication] Error resolving cross-store reviews:", error);
  }

  const reviews = await db.review.findMany({
    where: {
      OR: targetQueryConditions,
      status: { in: PUBLISHED_STATUSES },
    },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
    select: PUBLIC_REVIEW_SELECT,
  });

  const { active, translation } = await getActiveTranslationContext(shopNorm);

  const { attachPublicMediaUrls } = await import("../lib/review-media.server.js");
  const withMedia = attachPublicMediaUrls(request, reviews);

  const payload = withMedia.map((r) => {
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
    };
  });

  const body = JSON.stringify(payload);
  setPublicCache(cacheKey, body, {
    tags: [
      `reviews:${shopNorm}`,
      ...idVariants.map((id) => `reviews:${shopNorm}:product:${id}`),
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
    console.error("[api.public.reviews] loader failed:", err);
    return new Response(JSON.stringify({ error: "Could not load reviews" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let shop;
    let productId;
    let productName;
    let rating;
    let comment;
    let author;
    let title;
    let email;
    let mediaFiles = [];
    let productImage;

    if (contentType.includes("multipart/form-data")) {
      const fd = await request.formData();
      shop = fd.get("shop");
      productId = fd.get("productId");
      productName = fd.get("productName");
      rating = fd.get("rating");
      comment = fd.get("comment");
      author = fd.get("author");
      title = fd.get("title");
      email = fd.get("email");
      productImage = fd.get("productImage");

      const shopNormEarly = normalizeShopDomain(shop);
      let formConfig = { showPhotos: true, showVideos: true };
      if (shopNormEarly) {
        const settingsRow = await db.settings.findUnique({ where: { shop: shopNormEarly } });
        if (settingsRow?.config) {
          try {
            const { mergeFormConfig } = await import("../lib/review-form-config.shared.js");
            formConfig = mergeFormConfig(JSON.parse(settingsRow.config));
          } catch {
            /* keep defaults */
          }
        }
      }

      const { extractMediaFilesFromForm } = await import("../lib/review-media.server.js");
      const mediaResult = extractMediaFilesFromForm(fd, {
        allowImages: formConfig.showPhotos !== false,
        allowVideos: formConfig.showVideos !== false,
      });
      if (!mediaResult.ok) {
        return new Response(JSON.stringify({ error: mediaResult.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      mediaFiles = mediaResult.files;
    } else {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      ({
        shop,
        productId,
        productName,
        rating,
        comment,
        author,
        title,
        email,
        productImage,
      } = body);
    }

    if (!shop || !productId || !rating || !comment) {
      return new Response("Missing fields", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const shopNorm = normalizeShopDomain(shop);

    const { canCreateReview, getShopPlanStatus } = await import("../lib/billing.server.js");
    const createCheck = await canCreateReview(shopNorm);
    if (!createCheck.ok) {
      return new Response(JSON.stringify({ error: createCheck.error }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planStatus = await getShopPlanStatus(shopNorm);
    if (mediaFiles.length > 0) {
      const { mediaKindFromMime } = await import("../lib/review-media.shared.js");
      const hasVideo = mediaFiles.some((f) => mediaKindFromMime(f.type) === "video");
      if (hasVideo && !planStatus.hasPro) {
        return new Response(
          JSON.stringify({ error: "Video reviews require a Pro plan." }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }
    const pid =
      normalizeShopifyProductId(productId) || String(productId).trim();

    let reviewData = {
      shop: shopNorm,
      productId: pid,
      productName: productName || "Unknown product",
      productImage: (typeof productImage === "string" ? productImage : "")?.trim() || null,
      rating: Number(rating),
      title: (typeof title === "string" ? title : "")?.trim() || null,
      comment: String(comment),
      author: (typeof author === "string" ? author : "")?.trim() || "Anonymous",
      email: (typeof email === "string" ? email : "")?.trim() || null,
      status: "PUBLISHED",
    };

    const created = await db.review.create({
      data: reviewData,
    });

    if (mediaFiles.length > 0) {
      const { saveReviewMedia } = await import("../lib/review-media.server.js");
      await saveReviewMedia(created.id, mediaFiles);
    }

    invalidateShopReviewsCache(shopNorm, [pid, productId]);

    // Return immediately — auto-translate and Flow triggers run after the response.
    void runPostReviewCreateTasks(shopNorm, created, reviewData);

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("[api.public.reviews] action failed:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
}

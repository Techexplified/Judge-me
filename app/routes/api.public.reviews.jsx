import db from "../db.server";
import { emitReviewCollectedFlowTrigger } from "../lib/flow-review-trigger.server";
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

  if (!productId || !shop) {
    return new Response("Missing params", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const shopNorm = normalizeShopDomain(shop);
  const idVariants = productIdMatchList(productId);
  if (idVariants.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let targetQueryConditions = [
    { shop: shopNorm, productId: { in: idVariants } },
  ];

  try {
    const link = await db.groupStoreLink.findUnique({
      where: { shop: shopNorm },
      include: { group: { include: { members: true } } },
    });

    if (link?.group) {
      const sisterShops = link.group.members
        .map((m) => normalizeShopDomain(m.shop))
        .filter((s) => s && s !== shopNorm);

      if (sisterShops.length > 0) {
        const productIndex = await db.productIndex.findFirst({
          where: { shop: shopNorm, productId: { in: idVariants } },
        });

        let matchingProducts = [];

        if (productIndex?.sku) {
          matchingProducts = await db.productIndex.findMany({
            where: {
              shop: { in: sisterShops },
              sku: productIndex.sku,
            },
          });
        } else if (productIndex?.handle) {
          matchingProducts = await db.productIndex.findMany({
            where: {
              shop: { in: sisterShops },
              handle: productIndex.handle,
            },
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

  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

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
    } = body);
  }

  if (!shop || !productId || !rating || !comment) {
    return new Response("Missing fields", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const shopNorm = normalizeShopDomain(shop);
  const pid =
    normalizeShopifyProductId(productId) || String(productId).trim();

  let reviewData = {
    shop: shopNorm,
    productId: pid,
    productName: productName || "Unknown product",
    rating: Number(rating),
    title: (typeof title === "string" ? title : "")?.trim() || null,
    comment: String(comment),
    author: (typeof author === "string" ? author : "")?.trim() || "Anonymous",
    email: (typeof email === "string" ? email : "")?.trim() || null,
    status: "PUBLISHED",
  };

  const { data: translatedData } = await maybeAutoTranslateReviewData(shopNorm, reviewData);
  reviewData = translatedData;

  const created = await db.review.create({
    data: reviewData,
  });

  if (mediaFiles.length > 0) {
    const { saveReviewMedia } = await import("../lib/review-media.server.js");
    await saveReviewMedia(created.id, mediaFiles);
  }

  await emitReviewCollectedFlowTrigger(shopNorm, created);

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

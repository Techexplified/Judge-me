import db from "../db.server";
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
  });

  return new Response(JSON.stringify(reviews), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { shop, productId, productName, rating, comment, author, title, email } = body;

  if (!shop || !productId || !rating || !comment) {
    return new Response("Missing fields", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const shopNorm = normalizeShopDomain(shop);
  const pid =
    normalizeShopifyProductId(productId) || String(productId).trim();

  await db.review.create({
    data: {
      shop: shopNorm,
      productId: pid,
      productName: productName || "Unknown product",
      rating: Number(rating),
      title: title?.trim() || null,
      comment,
      author: author?.trim() || "Anonymous",
      email: email?.trim() || null,
      status: "PUBLISHED",
    },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

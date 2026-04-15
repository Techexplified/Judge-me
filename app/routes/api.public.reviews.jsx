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

  const reviews = await db.review.findMany({
    where: {
      shop: shopNorm,
      productId: { in: idVariants },
      status: "PUBLISHED",
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

  const body = await request.json();
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

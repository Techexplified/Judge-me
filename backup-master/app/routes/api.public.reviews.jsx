import db from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/* ---------------- OPTIONS + GET ---------------- */
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

const reviews = await db.review.findMany({
    where: {
      shop: shop.replace(/\/$/, ""),
      productId,
      status: "PUBLISHED",
    },
    // select: { id: true, rating: true, comment: true, author: true, createdAt: true, reply: true }, // Ensure reply is included
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify(reviews), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ---------------- POST ---------------- */
export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const body = await request.json();
  const { shop, productId, productName, rating, comment, author } = body;

  if (!shop || !productId || !rating || !comment) {
    return new Response("Missing fields", {
      status: 400,
      headers: corsHeaders,
    });
  }

  await db.review.create({
    data: {
      shop: shop.replace(/\/$/, ""),
      productId,
      productName: productName || "Unknown product",
      rating: Number(rating),
      comment,
      author: author?.trim() || "Anonymous",
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

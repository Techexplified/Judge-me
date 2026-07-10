import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";
import {
  normalizeShopifyProductId,
  productIdMatchList,
} from "../utils/product-id.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Storefront-safe fields only (no email / shop internals). */
function toPublicQuestion(row) {
  if (!row) return null;
  const published = Boolean(row.replyPublished && row.reply);
  return {
    id: row.id,
    question: row.question,
    author: row.author,
    status: row.status,
    replyPublished: Boolean(row.replyPublished),
    createdAt: row.createdAt,
    reply: published ? row.reply : null,
    replyDate: published ? row.replyDate : null,
  };
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop || !productId) {
    return new Response(JSON.stringify({ error: "Missing Fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const shopNorm = normalizeShopDomain(shop);
    const idVariants = productIdMatchList(productId);
    if (idVariants.length === 0) {
      return new Response(JSON.stringify({ questions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const questions = await db.questionAndAnswer.findMany({
      where: { shop: shopNorm, productId: { in: idVariants } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        question: true,
        author: true,
        status: true,
        reply: true,
        replyDate: true,
        replyPublished: true,
        createdAt: true,
      },
    });

    return new Response(
      JSON.stringify({ questions: questions.map(toPublicQuestion) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[api.public.qa] loader failed:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
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
    const body = await request.json();
    const { shop, productId, productName, question, author, email } = body;

    if (!shop || !productId || !question || !author) {
      return new Response(JSON.stringify({ error: "Missing Fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shopNorm = normalizeShopDomain(shop);
    const pid = normalizeShopifyProductId(productId) || String(productId).trim();
    if (!pid) {
      return new Response(JSON.stringify({ error: "Invalid product" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmedQuestion = String(question).trim();
    const trimmedAuthor = String(author).trim();
    if (!trimmedQuestion || !trimmedAuthor) {
      return new Response(JSON.stringify({ error: "Missing Fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const created = await db.questionAndAnswer.create({
      data: {
        shop: shopNorm,
        productId: pid,
        productName: productName ? String(productName).trim() : null,
        question: trimmedQuestion,
        author: trimmedAuthor,
        email: email ? String(email).trim() : null,
        status: "UNANSWERED",
      },
    });

    return new Response(
      JSON.stringify({ ok: true, question: toPublicQuestion(created) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[api.public.qa] action failed:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

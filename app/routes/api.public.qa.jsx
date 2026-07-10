import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";
import { normalizeShopifyProductId } from "../utils/product-id.server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }) {

    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const productId = url.searchParams.get("productId");

    if (!shop || !productId) {
        return new Response("Missing Fields", { status: 400, headers: corsHeaders });
    }

    const shopNorm = normalizeShopDomain(shop);
    const pid = normalizeShopifyProductId(productId) || String(productId).trim();

    const questions = await db.questionAndAnswer.findMany({
        where: { shop: shopNorm, productId: pid },
        orderBy: { createdAt: "desc" },
    });

    return new Response(
        JSON.stringify({ questions }),
        {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        }
    );
}

export async function action({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const body = await request.json();
        const { shop, productId, productName, question, author, email } = body;

        if (!shop || !productId || !question || !author || !productName) {
            return new Response("Missing Fields", { status: 400, headers: corsHeaders });
        }

        const shopNorm = normalizeShopDomain(shop);
        const pid = normalizeShopifyProductId(productId) || String(productId).trim();

        const created = await db.questionAndAnswer.create({
            data: {
                shop: shopNorm,
                productId: pid,
                productName: productName || null,
                question: String(question).trim(),
                author: String(author).trim(),
                email: email ? String(email).trim() : null,
                status: "UNANSWERED",
            },
        });

        return new Response(JSON.stringify({ ok: true, question: created }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    } catch (err) {
        console.error("[api.public.qa] action failed:", err);
        return new Response(JSON.stringify({ error: err?.message ?? "Internal Server Error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
}
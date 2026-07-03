import { normalizeShopDomain } from "../utils/shop.server";
import { incrementWidgetView } from "../lib/collect-reviews.server.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

  const shopRaw = body?.shop;
  const event = body?.event;

  if (!shopRaw || !event) {
    return new Response(JSON.stringify({ error: "Missing shop or event" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const shop = normalizeShopDomain(shopRaw);
  if (event === "view" || event === "review_showcase_view" || event === "social_showcase_view") {
    await incrementWidgetView(shop);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return new Response(JSON.stringify({ error: "Use POST" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

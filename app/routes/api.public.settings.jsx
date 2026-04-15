import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shopRaw = url.searchParams.get("shop");

  if (!shopRaw) {
    return new Response(JSON.stringify({ error: "No shop provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const shop = normalizeShopDomain(shopRaw);
  const settings = await db.settings.findUnique({
    where: { shop },
  });

  let config = null;
  if (settings?.config) {
    try {
      config = JSON.parse(settings.config);
    } catch {
      config = null;
    }
  }

  return new Response(JSON.stringify({ config }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

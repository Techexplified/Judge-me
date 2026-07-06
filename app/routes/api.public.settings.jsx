import db from "../db.server";
import {
  getPublicCache,
  publicCacheHeaders,
  publicCacheKey,
  setPublicCache,
} from "../lib/public-cache.server.js";
import { normalizeShopDomain } from "../utils/shop.server";
import { stripSensitiveFromConfig } from "../lib/settings.server";

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
  const cacheKey = publicCacheKey(request, "public-settings");
  const cached = getPublicCache(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        ...publicCacheHeaders(true),
      },
    });
  }

  const settings = await db.settings.findUnique({
    where: { shop },
  });

  let config = null;
  if (settings?.config) {
    try {
      config = stripSensitiveFromConfig(JSON.parse(settings.config));
    } catch {
      config = null;
    }
  }

  const body = JSON.stringify({ config });
  setPublicCache(cacheKey, body, { tags: [`settings:${shop}`] });

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...publicCacheHeaders(false),
    },
  });
};

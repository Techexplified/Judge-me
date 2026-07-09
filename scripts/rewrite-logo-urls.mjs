/**
 * Rewrite proxy-relative brandLogoUrl values to absolute SHOPIFY_APP_URL paths
 * so logos work in admin + storefront.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const base = String(process.env.SHOPIFY_APP_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("SHOPIFY_APP_URL is not set — cannot rewrite logo URLs");
  process.exit(1);
}

const rows = await db.settings.findMany({ select: { shop: true, config: true } });
let updated = 0;

for (const row of rows) {
  let config;
  try {
    config = JSON.parse(row.config);
  } catch {
    continue;
  }
  const url = config.brandLogoUrl;
  if (typeof url !== "string") continue;

  let next = url;
  if (url.startsWith("/apps/judgeme-reviews/api/public/shop-asset/")) {
    next = `${base}${url.replace(/^\/apps\/judgeme-reviews/, "")}`;
  } else if (url.startsWith("/api/public/shop-asset/")) {
    next = `${base}${url}`;
  } else {
    continue;
  }

  if (next === url) continue;
  config.brandLogoUrl = next;
  await db.settings.update({
    where: { shop: row.shop },
    data: { config: JSON.stringify(config) },
  });
  console.log(row.shop, "→", next);
  updated += 1;
}

console.log({ updated, base });
await db.$disconnect();

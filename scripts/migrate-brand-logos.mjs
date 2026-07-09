/**
 * One-shot migration: move base64 brandLogoUrl out of Settings into ShopAsset.
 * Run: npm run db:migrate-logos
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(String(dataUrl || "").trim());
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64"),
  };
}

const rows = await db.settings.findMany({ select: { shop: true, config: true } });
let migrated = 0;
let skipped = 0;
let failed = 0;

for (const row of rows) {
  let config;
  try {
    config = JSON.parse(row.config);
  } catch {
    skipped += 1;
    continue;
  }

  const logo = config.brandLogoUrl;
  if (typeof logo !== "string" || !logo.startsWith("data:")) {
    skipped += 1;
    continue;
  }

  const parsed = parseDataUrl(logo);
  if (!parsed) {
    console.warn("skip unparseable logo", row.shop);
    failed += 1;
    continue;
  }

  try {
    const asset = await db.shopAsset.upsert({
      where: { shop_key: { shop: row.shop, key: "brandLogo" } },
      create: {
        shop: row.shop,
        key: "brandLogo",
        mimeType: parsed.mimeType,
        filename: "brand-logo",
        data: parsed.buffer,
      },
      update: {
        mimeType: parsed.mimeType,
        data: parsed.buffer,
      },
      select: { id: true },
    });

    const next = {
      ...config,
      brandLogoUrl: `/apps/judgeme-reviews/api/public/shop-asset/${asset.id}`,
    };

    // Prefer absolute app URL when available (admin + storefront safe).
    const appBase = String(process.env.SHOPIFY_APP_URL || "").replace(/\/$/, "");
    if (appBase) {
      next.brandLogoUrl = `${appBase}/api/public/shop-asset/${asset.id}`;
    }

    await db.settings.update({
      where: { shop: row.shop },
      data: { config: JSON.stringify(next) },
    });

    const before = Buffer.byteLength(row.config);
    const after = Buffer.byteLength(JSON.stringify(next));
    console.log(
      `migrated ${row.shop}: ${before} → ${after} bytes (saved ${before - after})`,
    );
    migrated += 1;
  } catch (err) {
    console.error("failed", row.shop, err.message);
    failed += 1;
  }
}

console.log({ migrated, skipped, failed, total: rows.length });
await db.$disconnect();

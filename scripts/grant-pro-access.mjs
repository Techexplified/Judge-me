/**
 * Grant complimentary Pro access for testing (no Shopify billing).
 *
 * Uses graceTrialEndsAt — the app treats an active grace period as Pro.
 * Do NOT rely on plan='pro' alone; billing.check() resets that on admin load.
 *
 * Usage:
 *   dotenv -e .env -- node scripts/grant-pro-access.mjs store.myshopify.com
 *   GRANT_DAYS=365 dotenv -e .env -- node scripts/grant-pro-access.mjs store-a.myshopify.com store-b.myshopify.com
 *
 * Revoke:
 *   dotenv -e .env -- node scripts/grant-pro-access.mjs --revoke store.myshopify.com
 */
import { PrismaClient } from "@prisma/client";

const GRANT_DAYS = Math.max(1, Number(process.env.GRANT_DAYS) || 90);
const db = new PrismaClient();

function normalizeShop(input) {
  let s = String(input || "").trim().toLowerCase();
  if (!s) return "";
  if (!s.includes(".")) s = `${s}.myshopify.com`;
  return s;
}

function addUtcDays(date, days) {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

async function grantShop(shop) {
  const existing = await db.shop.findUnique({ where: { shop } });
  if (!existing) {
    console.warn(`Skip ${shop}: no Shop row — install the app on that store first.`);
    return false;
  }

  const now = new Date();
  const endsAt = addUtcDays(now, GRANT_DAYS);

  await db.shop.update({
    where: { shop },
    data: {
      graceTrialEndsAt: endsAt,
      graceTrialGrantedAt: existing.graceTrialGrantedAt ?? now,
    },
  });

  console.log(`Granted Pro (grace trial): ${shop} until ${endsAt.toISOString()} (${GRANT_DAYS} days)`);
  return true;
}

async function revokeShop(shop) {
  const existing = await db.shop.findUnique({ where: { shop } });
  if (!existing) {
    console.warn(`Skip ${shop}: not found.`);
    return false;
  }

  await db.shop.update({
    where: { shop },
    data: { graceTrialEndsAt: null },
  });

  console.log(`Revoked Pro grace trial: ${shop}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2).filter(Boolean);
  const revoke = args[0] === "--revoke";
  const shops = (revoke ? args.slice(1) : args).map(normalizeShop).filter(Boolean);

  if (shops.length === 0) {
    console.error(
      "Usage: node scripts/grant-pro-access.mjs [--revoke] store.myshopify.com [more-shops...]",
    );
    process.exit(1);
  }

  let count = 0;
  for (const shop of shops) {
    const ok = revoke ? await revokeShop(shop) : await grantShop(shop);
    if (ok) count += 1;
  }

  console.log(`\nDone. ${revoke ? "Revoked" : "Granted"} ${count}/${shops.length} shop(s).`);
  if (!revoke) {
    console.log("Merchant may need to refresh the app admin to see Pro features.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

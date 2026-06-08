/**
 * Bulk-grant complimentary Pro grace trials to pre-billing merchants.
 * Usage: node scripts/grant-grace-trials.mjs
 * Optional: GRACE_TRIAL_CUTOFF_ISO=2026-06-08T00:00:00Z
 */
import { PrismaClient } from "@prisma/client";

const GRACE_TRIAL_DAYS = 14;
const GRACE_TRIAL_CUTOFF = new Date(
  process.env.GRACE_TRIAL_CUTOFF_ISO || "2026-06-08T00:00:00Z",
);
const ACTIVE_STATUSES = new Set(["ACTIVE", "ACCEPTED"]);

const db = new PrismaClient();

function addUtcDays(date, days) {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function hasActiveShopifyPro(record) {
  return (
    record.plan === "pro" &&
    record.subscriptionId &&
    record.subscriptionStatus &&
    ACTIVE_STATUSES.has(record.subscriptionStatus)
  );
}

function isEligible(record) {
  if (!record || record.graceTrialGrantedAt) return false;
  if (hasActiveShopifyPro(record)) return false;
  if (record.installedAt.getTime() >= GRACE_TRIAL_CUTOFF.getTime()) return false;
  return true;
}

async function main() {
  const shops = await db.shop.findMany({
    select: {
      shop: true,
      installedAt: true,
      plan: true,
      subscriptionId: true,
      subscriptionStatus: true,
      graceTrialGrantedAt: true,
      graceTrialEndsAt: true,
    },
  });

  if (shops.length === 0) {
    console.log("No Shop records found.");
    return;
  }

  const now = new Date();
  const endsAt = addUtcDays(now, GRACE_TRIAL_DAYS);
  let granted = 0;
  let skipped = 0;

  for (const record of shops) {
    if (!isEligible(record)) {
      skipped += 1;
      continue;
    }

    await db.shop.update({
      where: { shop: record.shop },
      data: {
        graceTrialEndsAt: endsAt,
        graceTrialGrantedAt: now,
      },
    });
    granted += 1;
    console.log(`Granted grace trial: ${record.shop} (until ${endsAt.toISOString()})`);
  }

  console.log(`\nDone. Granted=${granted}, skipped=${skipped}, total=${shops.length}`);
  console.log(`Cutoff: ${GRACE_TRIAL_CUTOFF.toISOString()} (installed before this date)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

/**
 * Reset shop billing state to Free plan (for local testing).
 * Usage: node scripts/reset-premium-trial.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const before = await db.shop.findMany({
    select: { shop: true, plan: true, subscriptionStatus: true },
  });

  if (before.length === 0) {
    console.log("No Shop records found — nothing to reset.");
    return;
  }

  const result = await db.shop.updateMany({
    data: {
      plan: "free",
      planStatus: "free",
      subscriptionId: null,
      subscriptionStatus: null,
      billingTrialEndsAt: null,
      uninstalledAt: null,
    },
  });

  console.log(`Reset billing to Free for ${result.count} shop(s).`);
  console.log("\nShops updated:");
  for (const row of before) {
    console.log(`  - ${row.shop} (was plan=${row.plan}, status=${row.subscriptionStatus})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

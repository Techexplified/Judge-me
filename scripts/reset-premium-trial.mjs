/**
 * One-time reset: give every shop a fresh 7-day premium trial.
 * Usage: node scripts/reset-premium-trial.mjs
 */
import { PrismaClient } from "@prisma/client";

const TRIAL_DAYS = 7;
const db = new PrismaClient();

async function main() {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const before = await db.shop.findMany({
    select: { shop: true, planStatus: true, trialEndsAt: true },
  });

  if (before.length === 0) {
    console.log("No Shop records found — nothing to reset.");
    return;
  }

  const result = await db.shop.updateMany({
    data: {
      trialEndsAt,
      planStatus: "trial",
      uninstalledAt: null,
    },
  });

  console.log(`Reset premium trial for ${result.count} shop(s).`);
  console.log(`New trial ends at: ${trialEndsAt.toISOString()} (${TRIAL_DAYS} days from now)`);
  console.log("\nShops updated:");
  for (const row of before) {
    console.log(
      `  - ${row.shop} (was ${row.planStatus}, ended ${row.trialEndsAt.toISOString()})`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

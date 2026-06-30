/**
 * Reset Pro feature usage counters for all shops on a Pro plan.
 * Usage: npm run db:reset-pro-usage
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const ACTIVE = ["ACTIVE", "ACCEPTED"];

async function main() {
  const now = new Date();

  const proShops = await db.shop.findMany({
    where: {
      OR: [
        {
          plan: "pro",
          OR: [
            { subscriptionStatus: null },
            { subscriptionStatus: { in: ACTIVE } },
          ],
        },
        { graceTrialEndsAt: { gt: now } },
      ],
    },
    select: { shop: true, plan: true, subscriptionStatus: true, graceTrialEndsAt: true },
  });

  const shopDomains = proShops.map((s) => s.shop);
  console.log(`Pro shops found: ${shopDomains.length}`);
  for (const s of proShops) {
    console.log(` - ${s.shop} (plan: ${s.plan}, sub: ${s.subscriptionStatus ?? "—"})`);
  }

  if (shopDomains.length === 0) {
    console.log("No pro shops to reset.");
    return;
  }

  const result = await db.featureUsage.deleteMany({
    where: { shop: { in: shopDomains } },
  });
  console.log(`Deleted ${result.count} FeatureUsage row(s) for pro shops.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

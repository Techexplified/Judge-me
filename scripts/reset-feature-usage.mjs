/**
 * Reset Pro feature usage counters for a shop (local testing).
 * Usage: node scripts/reset-feature-usage.mjs [shop.myshopify.com]
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const shopArg = process.argv[2];

  if (shopArg) {
    const result = await db.featureUsage.deleteMany({ where: { shop: shopArg } });
    console.log(`Deleted ${result.count} FeatureUsage row(s) for ${shopArg}.`);
    return;
  }

  const result = await db.featureUsage.deleteMany();
  console.log(`Deleted ${result.count} FeatureUsage row(s) for all shops.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

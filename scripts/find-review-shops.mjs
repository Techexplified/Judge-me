import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const rows = await db.review.findMany({
  where: { status: { in: ["PUBLISHED", "APPROVED"] } },
  select: { shop: true, productId: true, id: true },
  take: 20,
  orderBy: { createdAt: "desc" },
});

const byShop = {};
for (const r of rows) {
  byShop[r.shop] = byShop[r.shop] || [];
  byShop[r.shop].push(r);
}
console.log(JSON.stringify(byShop, null, 2));
await db.$disconnect();

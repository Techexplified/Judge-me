import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const rows = await db.settings.findMany({ select: { shop: true, config: true } });
for (const r of rows) {
  try {
    const c = JSON.parse(r.config);
    if (c.brandLogoUrl) {
      console.log(r.shop, String(c.brandLogoUrl).slice(0, 140));
    }
  } catch {
    /* ignore */
  }
}
await db.$disconnect();

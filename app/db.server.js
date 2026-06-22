import { PrismaClient } from "@prisma/client";

function createPrisma(url) {
  return new PrismaClient(
    url
      ? {
          datasources: { db: { url } },
        }
      : undefined,
  );
}

/** Pooled URL for general app queries (Neon pooler). */
const prisma =
  global.prismaGlobal ?? createPrisma(process.env.DATABASE_URL);

/**
 * Direct URL for Shopify session storage startup checks.
 * Neon pooler can fail cold-start table probes with a misleading "session table missing" error.
 */
const sessionPrisma =
  global.sessionPrismaGlobal ??
  createPrisma(process.env.DIRECT_URL || process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
  global.sessionPrismaGlobal = sessionPrisma;
}

export default prisma;
export { sessionPrisma };

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
 * Prefer DATABASE_URL (pooler) for normal queries — DIRECT_URL multiplies Neon transfer.
 */
const sessionPrisma =
  global.sessionPrismaGlobal ??
  createPrisma(process.env.DIRECT_URL || process.env.DATABASE_URL);

// Reuse clients across warm serverless invocations (cuts Neon connections + transfer).
global.prismaGlobal = prisma;
global.sessionPrismaGlobal = sessionPrisma;

export default prisma;
export { sessionPrisma };

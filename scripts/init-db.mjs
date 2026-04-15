import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT,
    "productImage" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reply" TEXT,
    "replyDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Settings_shop_key" ON "Settings"("shop")`,
  `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "reply" TEXT`,
  `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "replyDate" TIMESTAMP(3)`
];

try {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log("DB INIT OK");
} catch (error) {
  console.error("DB INIT FAILED");
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

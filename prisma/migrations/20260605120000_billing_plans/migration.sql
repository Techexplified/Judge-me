-- AlterTable: extend Shop for Shopify billing
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "billingTrialEndsAt" TIMESTAMP(3);
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "reviewsThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "reviewsMonthKey" TEXT;

-- Make trialEndsAt optional (legacy)
ALTER TABLE "Shop" ALTER COLUMN "trialEndsAt" DROP NOT NULL;

-- Migrate legacy planStatus values to new plan field
UPDATE "Shop" SET "plan" = 'pro', "subscriptionStatus" = 'ACTIVE'
WHERE "planStatus" = 'active' AND "plan" = 'free';

UPDATE "Shop" SET "planStatus" = 'free' WHERE "planStatus" IN ('trial', 'expired');

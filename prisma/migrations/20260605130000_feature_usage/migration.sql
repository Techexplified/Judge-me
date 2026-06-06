-- CreateTable
CREATE TABLE "FeatureUsage" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FeatureUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureUsage_shop_monthKey_idx" ON "FeatureUsage"("shop", "monthKey");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureUsage_shop_featureKey_monthKey_key" ON "FeatureUsage"("shop", "featureKey", "monthKey");

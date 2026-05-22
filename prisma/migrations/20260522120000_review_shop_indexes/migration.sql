-- CreateIndex
CREATE INDEX "Review_shop_idx" ON "Review"("shop");

-- CreateIndex
CREATE INDEX "Review_shop_createdAt_idx" ON "Review"("shop", "createdAt");

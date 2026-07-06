-- Public storefront review queries filter by shop/status/scope and sort by createdAt.
CREATE INDEX "Review_shop_status_createdAt_idx" ON "Review"("shop", "status", "createdAt");

-- Product review widgets resolve a single product's published reviews newest-first.
CREATE INDEX "Review_shop_productId_status_createdAt_idx" ON "Review"("shop", "productId", "status", "createdAt");

-- Rating summary bars use grouped rating counts scoped to published reviews.
CREATE INDEX "Review_shop_status_rating_idx" ON "Review"("shop", "status", "rating");

-- Media filters use relation existence checks by review and media type.
CREATE INDEX "ReviewMedia_reviewId_type_idx" ON "ReviewMedia"("reviewId", "type");

-- Store-group member lookups need the inverse side of the relation.
CREATE INDEX "GroupStoreLink_groupId_idx" ON "GroupStoreLink"("groupId");

-- Cross-store product matching looks up sister products by shop + SKU/handle.
CREATE INDEX "ProductIndex_shop_sku_idx" ON "ProductIndex"("shop", "sku");
CREATE INDEX "ProductIndex_shop_handle_idx" ON "ProductIndex"("shop", "handle");

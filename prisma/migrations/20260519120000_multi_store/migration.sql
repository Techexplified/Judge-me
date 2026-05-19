-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "planStatus" TEXT NOT NULL DEFAULT 'trial',
    "uninstalledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupStoreLink" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupStoreLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductIndex" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "sku" TEXT,
    "title" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductIndex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shop_key" ON "Shop"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "GroupStoreLink_shop_key" ON "GroupStoreLink"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIndex_shop_productId_key" ON "ProductIndex"("shop", "productId");

-- CreateIndex
CREATE INDEX "ProductIndex_sku_idx" ON "ProductIndex"("sku");

-- CreateIndex
CREATE INDEX "ProductIndex_handle_idx" ON "ProductIndex"("handle");

-- AddForeignKey
ALTER TABLE "GroupStoreLink" ADD CONSTRAINT "GroupStoreLink_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StoreGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

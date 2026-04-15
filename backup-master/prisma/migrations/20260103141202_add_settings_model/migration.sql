-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_shop_key" ON "Settings"("shop");

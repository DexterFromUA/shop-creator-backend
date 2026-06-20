/*
  Warnings:

  - You are about to drop the `ProductOption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductOption" DROP CONSTRAINT "ProductOption_productId_fkey";

-- DropTable
DROP TABLE "ProductOption";

-- CreateTable
CREATE TABLE "ProductOptions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "productId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "isPreOrder" BOOLEAN NOT NULL DEFAULT false,
    "isDiscount" BOOLEAN NOT NULL DEFAULT false,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "isLimited" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductOptions_productId_name_idx" ON "ProductOptions"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOptions_productId_name_key" ON "ProductOptions"("productId", "name");

-- AddForeignKey
ALTER TABLE "ProductOptions" ADD CONSTRAINT "ProductOptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

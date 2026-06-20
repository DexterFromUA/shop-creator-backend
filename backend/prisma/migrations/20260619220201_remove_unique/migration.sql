/*
  Warnings:

  - A unique constraint covering the columns `[productId]` on the table `ProductOptions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProductOptions_productId_name_idx";

-- DropIndex
DROP INDEX "ProductOptions_productId_name_key";

-- CreateIndex
CREATE INDEX "ProductOptions_productId_idx" ON "ProductOptions"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOptions_productId_key" ON "ProductOptions"("productId");

/*
  Warnings:

  - A unique constraint covering the columns `[productId,name]` on the table `ProductOption` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProductOption_productId_name_key" ON "ProductOption"("productId", "name");

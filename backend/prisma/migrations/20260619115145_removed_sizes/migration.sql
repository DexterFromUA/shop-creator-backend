/*
  Warnings:

  - You are about to drop the column `discountPercent` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isDiscount` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isPreOrder` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `ProductSize` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `price` on table `ProductOptions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ProductSize" DROP CONSTRAINT "ProductSize_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "discountPercent",
DROP COLUMN "isDiscount",
DROP COLUMN "isPreOrder",
DROP COLUMN "price";

-- AlterTable
ALTER TABLE "ProductOptions" ALTER COLUMN "price" SET NOT NULL;

-- DropTable
DROP TABLE "ProductSize";

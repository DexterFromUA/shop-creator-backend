/*
  Warnings:

  - The values [EXTRA_SMALL,SMALL,MEDIUM,LARGE,EXTRA_LARGE] on the enum `Size` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Size_new" AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL');
ALTER TABLE "ProductSize" ALTER COLUMN "size" TYPE "Size_new" USING ("size"::text::"Size_new");
ALTER TYPE "Size" RENAME TO "Size_old";
ALTER TYPE "Size_new" RENAME TO "Size";
DROP TYPE "Size_old";
COMMIT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "description" TEXT,
ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDiscount" BOOLEAN NOT NULL DEFAULT false;

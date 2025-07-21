/*
  Warnings:

  - You are about to drop the column `paymentCardCvv` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `paymentCardExpiryMonth` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `paymentCardExpiryYear` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `paymentCardHolder` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `paymentCardNumber` on the `Store` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "paymentCardCvv" TEXT,
ADD COLUMN     "paymentCardExpiryMonth" INTEGER,
ADD COLUMN     "paymentCardExpiryYear" INTEGER,
ADD COLUMN     "paymentCardHolder" TEXT,
ADD COLUMN     "paymentCardNumber" TEXT;

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "paymentCardCvv",
DROP COLUMN "paymentCardExpiryMonth",
DROP COLUMN "paymentCardExpiryYear",
DROP COLUMN "paymentCardHolder",
DROP COLUMN "paymentCardNumber";

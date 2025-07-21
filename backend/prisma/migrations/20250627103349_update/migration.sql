-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('BASIC', 'ADVANCED', 'UNLIMITED');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "subscriptionActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionType" "SubscriptionType" NOT NULL DEFAULT 'BASIC';

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "contactAddress" TEXT,
ADD COLUMN     "contactCity" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "paymentCardCvv" TEXT,
ADD COLUMN     "paymentCardExpiryMonth" INTEGER,
ADD COLUMN     "paymentCardExpiryYear" INTEGER,
ADD COLUMN     "paymentCardHolder" TEXT,
ADD COLUMN     "paymentCardNumber" TEXT;

-- AlterEnum
ALTER TYPE "SubscriptionType" ADD VALUE 'PRO';

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "subscriptionActive" SET DEFAULT true;

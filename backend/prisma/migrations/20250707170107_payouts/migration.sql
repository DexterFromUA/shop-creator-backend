-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'PAYOUT', 'REFUND', 'FEE', 'CHARGEBACK', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'DISPUTED');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "bankAccountHolder" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankIban" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankSwiftCode" TEXT;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "externalId" TEXT,
    "paymentMethod" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "processingFee" DOUBLE PRECISION,
    "netAmount" DOUBLE PRECISION,
    "referenceOrderId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_storeId_status_idx" ON "Transaction"("storeId", "status");

-- CreateIndex
CREATE INDEX "Transaction_type_status_idx" ON "Transaction"("type", "status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

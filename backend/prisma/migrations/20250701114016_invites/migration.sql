-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('MANAGER', 'COURIER');

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_storeId_idx" ON "Invite"("storeId");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

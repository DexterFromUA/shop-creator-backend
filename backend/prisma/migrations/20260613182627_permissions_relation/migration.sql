/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the `_StoreCourier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_StoreManager` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "Permissions" ADD VALUE 'OWNER';

-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "_StoreCourier" DROP CONSTRAINT "_StoreCourier_A_fkey";

-- DropForeignKey
ALTER TABLE "_StoreCourier" DROP CONSTRAINT "_StoreCourier_B_fkey";

-- DropForeignKey
ALTER TABLE "_StoreManager" DROP CONSTRAINT "_StoreManager_A_fkey";

-- DropForeignKey
ALTER TABLE "_StoreManager" DROP CONSTRAINT "_StoreManager_B_fkey";

-- DropIndex
DROP INDEX "Store_ownerId_idx";

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "ownerId";

-- DropTable
DROP TABLE "_StoreCourier";

-- DropTable
DROP TABLE "_StoreManager";

-- CreateTable
CREATE TABLE "StoreClients" (
    "storeId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "permissions" "Permissions"[],

    CONSTRAINT "StoreClients_pkey" PRIMARY KEY ("storeId","clientId")
);

-- AddForeignKey
ALTER TABLE "StoreClients" ADD CONSTRAINT "StoreClients_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreClients" ADD CONSTRAINT "StoreClients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

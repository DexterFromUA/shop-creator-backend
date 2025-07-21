/*
  Warnings:

  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Store` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_StoreCourier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_StoreManager` table. If the table is not empty, all the data it contains will be lost.

*/
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

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "Store";

-- DropTable
DROP TABLE "_StoreCourier";

-- DropTable
DROP TABLE "_StoreManager";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

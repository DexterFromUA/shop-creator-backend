/*
  Warnings:

  - The values [OWNER,MANAGER,COURIER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[emailVerificationToken]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneVerificationToken]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `Store` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'USER');
ALTER TABLE "Client" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_ownerId_fkey";

-- DropIndex
DROP INDEX "Store_ownerId_key";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "phoneVerificationToken" TEXT,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'USER';

-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "name" SET NOT NULL;

-- CreateTable
CREATE TABLE "_StoreManager" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StoreManager_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StoreCourier" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StoreCourier_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_StoreManager_B_index" ON "_StoreManager"("B");

-- CreateIndex
CREATE INDEX "_StoreCourier_B_index" ON "_StoreCourier"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Client_emailVerificationToken_key" ON "Client"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Client_phoneVerificationToken_key" ON "Client"("phoneVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Client_passwordResetToken_key" ON "Client"("passwordResetToken");

-- CreateIndex
CREATE INDEX "Store_ownerId_idx" ON "Store"("ownerId");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoreManager" ADD CONSTRAINT "_StoreManager_A_fkey" FOREIGN KEY ("A") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoreManager" ADD CONSTRAINT "_StoreManager_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoreCourier" ADD CONSTRAINT "_StoreCourier_A_fkey" FOREIGN KEY ("A") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoreCourier" ADD CONSTRAINT "_StoreCourier_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

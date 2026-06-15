/*
  Warnings:

  - You are about to drop the column `role` on the `Invite` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Permissions" AS ENUM ('ORDERS', 'PRODUCTS', 'PAYOUTS', 'NOTIFICATIONS', 'USERS', 'TEAM', 'STORE', 'APP');

-- AlterTable
ALTER TABLE "Invite" DROP COLUMN "role",
ADD COLUMN     "permissions" "Permissions"[];

-- DropEnum
DROP TYPE "TeamRole";

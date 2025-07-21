/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `App` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `App` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "App_name_idx";

-- AlterTable
ALTER TABLE "App" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#111827',
ADD COLUMN     "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "secondaryColor" TEXT NOT NULL DEFAULT '#6b7280',
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "splashScreenUrl" TEXT,
ADD COLUMN     "targetPlatforms" TEXT[] DEFAULT ARRAY['WEB']::TEXT[],
ALTER COLUMN "version" SET DEFAULT '1.0.0';

-- CreateIndex
CREATE UNIQUE INDEX "App_slug_key" ON "App"("slug");

-- CreateIndex
CREATE INDEX "App_name_slug_idx" ON "App"("name", "slug");

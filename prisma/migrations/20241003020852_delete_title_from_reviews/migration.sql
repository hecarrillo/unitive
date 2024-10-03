/*
  Warnings:

  - You are about to drop the column `title` on the `SiteReview` table. All the data in the column will be lost.
  - You are about to drop the `UserAspectPreference` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserAspectPreference" DROP CONSTRAINT "UserAspectPreference_aspectId_fkey";

-- DropForeignKey
ALTER TABLE "UserAspectPreference" DROP CONSTRAINT "UserAspectPreference_userId_fkey";

-- AlterTable
ALTER TABLE "SiteReview" DROP COLUMN "title";

-- DropTable
DROP TABLE "UserAspectPreference";

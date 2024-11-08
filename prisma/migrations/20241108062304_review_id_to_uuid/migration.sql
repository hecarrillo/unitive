/*
  Warnings:

  - The primary key for the `SiteReview` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "SiteReview" DROP CONSTRAINT "SiteReview_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "SiteReview_pkey" PRIMARY KEY ("id");

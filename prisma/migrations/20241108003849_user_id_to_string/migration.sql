/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "FavoriteUserLocation" DROP CONSTRAINT "FavoriteUserLocation_userId_fkey";

-- DropForeignKey
ALTER TABLE "SiteReview" DROP CONSTRAINT "SiteReview_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRouteLocation" DROP CONSTRAINT "UserRouteLocation_userId_fkey";

-- AlterTable
ALTER TABLE "FavoriteUserLocation" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SiteReview" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "UserRouteLocation" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "SiteReview" ADD CONSTRAINT "SiteReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteUserLocation" ADD CONSTRAINT "FavoriteUserLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRouteLocation" ADD CONSTRAINT "UserRouteLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

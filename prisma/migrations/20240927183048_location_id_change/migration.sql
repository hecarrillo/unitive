/*
  Warnings:

  - The primary key for the `TouristicLocation` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "FavoriteUserLocation" DROP CONSTRAINT "FavoriteUserLocation_locationId_fkey";

-- DropForeignKey
ALTER TABLE "LocationAspectRating" DROP CONSTRAINT "LocationAspectRating_locationId_fkey";

-- DropForeignKey
ALTER TABLE "SiteReview" DROP CONSTRAINT "SiteReview_locationId_fkey";

-- DropForeignKey
ALTER TABLE "UserRouteLocation" DROP CONSTRAINT "UserRouteLocation_locationId_fkey";

-- AlterTable
ALTER TABLE "FavoriteUserLocation" ALTER COLUMN "locationId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "LocationAspectRating" ALTER COLUMN "locationId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SiteReview" ALTER COLUMN "locationId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TouristicLocation" DROP CONSTRAINT "TouristicLocation_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "TouristicLocation_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "TouristicLocation_id_seq";

-- AlterTable
ALTER TABLE "UserRouteLocation" ALTER COLUMN "locationId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "SiteReview" ADD CONSTRAINT "SiteReview_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TouristicLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationAspectRating" ADD CONSTRAINT "LocationAspectRating_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TouristicLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteUserLocation" ADD CONSTRAINT "FavoriteUserLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TouristicLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRouteLocation" ADD CONSTRAINT "UserRouteLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TouristicLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

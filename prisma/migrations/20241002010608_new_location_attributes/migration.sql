/*
  Warnings:

  - You are about to drop the column `googlePlaceId` on the `TouristicLocation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TouristicLocation_googlePlaceId_key";

-- AlterTable
ALTER TABLE "TouristicLocation" DROP COLUMN "googlePlaceId",
ADD COLUMN     "accessible" JSONB,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "openingHours" JSONB,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;

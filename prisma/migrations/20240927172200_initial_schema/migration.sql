-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('GMAPS', 'TA', 'USR');

-- CreateTable
CREATE TABLE "TouristicLocation" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "summarizedReview" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "googlePlaceId" TEXT,
    "tripAdvisorPlaceId" TEXT,

    CONSTRAINT "TouristicLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteReview" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "extractedDate" TIMESTAMP(3) NOT NULL,
    "source" "ReviewSource" NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "SiteReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aspect" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Aspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAspectPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "aspectId" INTEGER NOT NULL,
    "preferenceOrder" INTEGER NOT NULL,

    CONSTRAINT "UserAspectPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationAspectRating" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "aspectId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "generatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationAspectRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "LocationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteUserLocation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "FavoriteUserLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRouteLocation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "UserRouteLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TouristicLocation_googlePlaceId_key" ON "TouristicLocation"("googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "TouristicLocation_tripAdvisorPlaceId_key" ON "TouristicLocation"("tripAdvisorPlaceId");

-- CreateIndex
CREATE INDEX "TouristicLocation_categoryId_idx" ON "TouristicLocation"("categoryId");

-- CreateIndex
CREATE INDEX "TouristicLocation_name_idx" ON "TouristicLocation"("name");

-- CreateIndex
CREATE INDEX "TouristicLocation_rating_idx" ON "TouristicLocation"("rating");

-- CreateIndex
CREATE INDEX "TouristicLocation_latitude_longitude_idx" ON "TouristicLocation"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "SiteReview_locationId_idx" ON "SiteReview"("locationId");

-- CreateIndex
CREATE INDEX "SiteReview_userId_idx" ON "SiteReview"("userId");

-- CreateIndex
CREATE INDEX "SiteReview_rating_idx" ON "SiteReview"("rating");

-- CreateIndex
CREATE INDEX "SiteReview_extractedDate_idx" ON "SiteReview"("extractedDate");

-- CreateIndex
CREATE UNIQUE INDEX "Aspect_name_key" ON "Aspect"("name");

-- CreateIndex
CREATE INDEX "UserAspectPreference_userId_idx" ON "UserAspectPreference"("userId");

-- CreateIndex
CREATE INDEX "UserAspectPreference_aspectId_idx" ON "UserAspectPreference"("aspectId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAspectPreference_userId_aspectId_key" ON "UserAspectPreference"("userId", "aspectId");

-- CreateIndex
CREATE INDEX "LocationAspectRating_locationId_idx" ON "LocationAspectRating"("locationId");

-- CreateIndex
CREATE INDEX "LocationAspectRating_aspectId_idx" ON "LocationAspectRating"("aspectId");

-- CreateIndex
CREATE INDEX "LocationAspectRating_rating_idx" ON "LocationAspectRating"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "LocationAspectRating_locationId_aspectId_key" ON "LocationAspectRating"("locationId", "aspectId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationCategory_name_key" ON "LocationCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "FavoriteUserLocation_userId_idx" ON "FavoriteUserLocation"("userId");

-- CreateIndex
CREATE INDEX "FavoriteUserLocation_locationId_idx" ON "FavoriteUserLocation"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteUserLocation_userId_locationId_key" ON "FavoriteUserLocation"("userId", "locationId");

-- CreateIndex
CREATE INDEX "UserRouteLocation_userId_idx" ON "UserRouteLocation"("userId");

-- CreateIndex
CREATE INDEX "UserRouteLocation_locationId_idx" ON "UserRouteLocation"("locationId");

-- AddForeignKey
ALTER TABLE "TouristicLocation" ADD CONSTRAINT "TouristicLocation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LocationCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteReview" ADD CONSTRAINT "SiteReview_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TouristicLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteReview" ADD CONSTRAINT "SiteReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAspectPreference" ADD CONSTRAINT "UserAspectPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAspectPreference" ADD CONSTRAINT "UserAspectPreference_aspectId_fkey" FOREIGN KEY ("aspectId") REFERENCES "Aspect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationAspectRating" ADD CONSTRAINT "LocationAspectRating_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TouristicLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationAspectRating" ADD CONSTRAINT "LocationAspectRating_aspectId_fkey" FOREIGN KEY ("aspectId") REFERENCES "Aspect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteUserLocation" ADD CONSTRAINT "FavoriteUserLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteUserLocation" ADD CONSTRAINT "FavoriteUserLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TouristicLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRouteLocation" ADD CONSTRAINT "UserRouteLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRouteLocation" ADD CONSTRAINT "UserRouteLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TouristicLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

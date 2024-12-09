-- CreateTable
CREATE TABLE "LocationUserReport" (
    "id" SERIAL NOT NULL,
    "locationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationUserReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationUserReport_locationId_idx" ON "LocationUserReport"("locationId");

-- CreateIndex
CREATE INDEX "LocationUserReport_userId_idx" ON "LocationUserReport"("userId");

-- CreateIndex
CREATE INDEX "LocationUserReport_created_idx" ON "LocationUserReport"("created");

-- AddForeignKey
ALTER TABLE "LocationUserReport" ADD CONSTRAINT "LocationUserReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TouristicLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationUserReport" ADD CONSTRAINT "LocationUserReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

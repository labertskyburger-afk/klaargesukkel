-- CreateEnum
CREATE TYPE "AreaUnitType" AS ENUM ('official_planning_suburb', 'local_market');

-- CreateEnum
CREATE TYPE "AreaBoundaryConfidence" AS ENUM ('official', 'analytical', 'unverified');

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitType" "AreaUnitType" NOT NULL,
    "parentAreaId" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "boundaryConfidence" "AreaBoundaryConfidence" NOT NULL DEFAULT 'official',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN "areaId" TEXT;

-- CreateIndex
CREATE INDEX "Area_regionId_idx" ON "Area"("regionId");

-- CreateIndex
CREATE INDEX "Signal_areaId_idx" ON "Signal"("areaId");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_parentAreaId_fkey" FOREIGN KEY ("parentAreaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

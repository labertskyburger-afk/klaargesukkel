-- CreateEnum
CREATE TYPE "DigestGeneratedBy" AS ENUM ('scheduled', 'manual');

-- AlterTable
ALTER TABLE "DigestReport" ADD COLUMN "rollupNote" TEXT;
ALTER TABLE "DigestReport" ADD COLUMN "excludedSummary" TEXT;
ALTER TABLE "DigestReport" ADD COLUMN "generatedBy" "DigestGeneratedBy" NOT NULL DEFAULT 'scheduled';

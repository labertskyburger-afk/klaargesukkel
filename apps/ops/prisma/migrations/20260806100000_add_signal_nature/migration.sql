-- CreateEnum
CREATE TYPE "SignalNature" AS ENUM ('commercial', 'civic_municipal');

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN "nature" "SignalNature";

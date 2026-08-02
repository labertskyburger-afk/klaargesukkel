-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('demand', 'supply', 'unclear');

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN "signalType" "SignalType";

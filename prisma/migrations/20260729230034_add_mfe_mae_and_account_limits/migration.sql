-- AlterTable
ALTER TABLE "PropFirmAccount" ADD COLUMN "dailyLossLimit" REAL;
ALTER TABLE "PropFirmAccount" ADD COLUMN "maxDrawdownLimit" REAL;
ALTER TABLE "PropFirmAccount" ADD COLUMN "startingBalance" REAL;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN "maeR" REAL;
ALTER TABLE "Trade" ADD COLUMN "mfeR" REAL;

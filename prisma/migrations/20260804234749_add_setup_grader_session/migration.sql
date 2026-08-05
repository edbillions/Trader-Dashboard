-- AlterTable
ALTER TABLE "TradingDay" ADD COLUMN "graderBias" TEXT;

-- CreateTable
CREATE TABLE "SetupGraderNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradingDayId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SetupGraderNote_tradingDayId_fkey" FOREIGN KEY ("tradingDayId") REFERENCES "TradingDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

/*
  Warnings:

  - You are about to drop the column `htfTimeframe` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `intermediateTimeframe` on the `Trade` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradingDayId" TEXT NOT NULL,
    "accountId" TEXT,
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL,
    "entryTime" DATETIME NOT NULL,
    "exitTime" DATETIME,
    "stopLossPlanned" REAL,
    "stopLossActual" REAL,
    "targetPlanned" REAL,
    "targetActual" REAL,
    "positionSize" INTEGER NOT NULL,
    "grossPnl" REAL,
    "commission" REAL,
    "netPnl" REAL,
    "rMultiple" REAL,
    "htfChartLink" TEXT,
    "intermediateChartLink" TEXT,
    "entryChartLink" TEXT,
    "entryTimeframe" TEXT,
    "entryModel" TEXT,
    "session" TEXT,
    "setupGrade" TEXT,
    "dailyBias" TEXT,
    "htfPoi" TEXT,
    "htfDol" TEXT,
    "mfeR" REAL,
    "maeR" REAL,
    "writeup" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_tradingDayId_fkey" FOREIGN KEY ("tradingDayId") REFERENCES "TradingDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PropFirmAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("accountId", "commission", "createdAt", "dailyBias", "direction", "entryModel", "entryPrice", "entryTime", "entryTimeframe", "exitPrice", "exitTime", "grossPnl", "htfDol", "htfPoi", "id", "maeR", "mfeR", "netPnl", "positionSize", "rMultiple", "session", "setupGrade", "stopLossActual", "stopLossPlanned", "symbol", "targetActual", "targetPlanned", "tradingDayId", "updatedAt", "writeup") SELECT "accountId", "commission", "createdAt", "dailyBias", "direction", "entryModel", "entryPrice", "entryTime", "entryTimeframe", "exitPrice", "exitTime", "grossPnl", "htfDol", "htfPoi", "id", "maeR", "mfeR", "netPnl", "positionSize", "rMultiple", "session", "setupGrade", "stopLossActual", "stopLossPlanned", "symbol", "targetActual", "targetPlanned", "tradingDayId", "updatedAt", "writeup" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

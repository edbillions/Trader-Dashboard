-- AlterTable
ALTER TABLE "TradingDay" ADD COLUMN "debriefFeeling" TEXT;
ALTER TABLE "TradingDay" ADD COLUMN "debriefImprovement" TEXT;
ALTER TABLE "TradingDay" ADD COLUMN "emergencyPauseUntil" DATETIME;
ALTER TABLE "TradingDay" ADD COLUMN "missionLabel" TEXT;
ALTER TABLE "TradingDay" ADD COLUMN "profitLockPlan" REAL;
ALTER TABLE "TradingDay" ADD COLUMN "sessionEndedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "anthropicApiKey" TEXT,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 5
);
INSERT INTO "new_AppSettings" ("anthropicApiKey", "id", "timezone") SELECT "anthropicApiKey", "id", "timezone" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
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
    "setupFactorsChecklist" TEXT,
    "mfeR" REAL,
    "maeR" REAL,
    "writeup" TEXT,
    "smartReview" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "quickLogged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_tradingDayId_fkey" FOREIGN KEY ("tradingDayId") REFERENCES "TradingDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PropFirmAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("accountId", "commission", "createdAt", "dailyBias", "direction", "entryChartLink", "entryModel", "entryPrice", "entryTime", "entryTimeframe", "exitPrice", "exitTime", "grossPnl", "htfChartLink", "htfDol", "htfPoi", "id", "intermediateChartLink", "maeR", "mfeR", "netPnl", "positionSize", "rMultiple", "reviewed", "session", "setupFactorsChecklist", "setupGrade", "smartReview", "stopLossActual", "stopLossPlanned", "symbol", "targetActual", "targetPlanned", "tradingDayId", "updatedAt", "writeup") SELECT "accountId", "commission", "createdAt", "dailyBias", "direction", "entryChartLink", "entryModel", "entryPrice", "entryTime", "entryTimeframe", "exitPrice", "exitTime", "grossPnl", "htfChartLink", "htfDol", "htfPoi", "id", "intermediateChartLink", "maeR", "mfeR", "netPnl", "positionSize", "rMultiple", "reviewed", "session", "setupFactorsChecklist", "setupGrade", "smartReview", "stopLossActual", "stopLossPlanned", "symbol", "targetActual", "targetPlanned", "tradingDayId", "updatedAt", "writeup" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

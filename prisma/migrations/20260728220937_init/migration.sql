-- CreateTable
CREATE TABLE "PropFirmAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AccountExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountExpense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PropFirmAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountPayout_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PropFirmAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradingDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "htfBias" TEXT,
    "keyLevels" TEXT,
    "sessionTiming" TEXT,
    "news" TEXT,
    "maxLossPlan" REAL,
    "positionSizePlan" TEXT,
    "maxTradeCountPlan" INTEGER,
    "planAdherenceGrade" TEXT,
    "psychologyLog" TEXT,
    "freeformNotes" TEXT,
    "aiSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RuleViolationChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Trade" (
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
    "htfTimeframe" TEXT,
    "intermediateTimeframe" TEXT,
    "entryTimeframe" TEXT,
    "entryModel" TEXT,
    "session" TEXT,
    "setupGrade" TEXT,
    "dailyBias" TEXT,
    "htfPoi" TEXT,
    "htfDol" TEXT,
    "writeup" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_tradingDayId_fkey" FOREIGN KEY ("tradingDayId") REFERENCES "TradingDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PropFirmAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MissedTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradingDayId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "setupDescription" TEXT,
    "reasonMissed" TEXT,
    "entryModel" TEXT,
    "session" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissedTrade_tradingDayId_fkey" FOREIGN KEY ("tradingDayId") REFERENCES "TradingDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Screenshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Screenshot_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfluenceFactor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "EntryModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "TradeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "MistakeType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tier" TEXT NOT NULL,
    "targetAmount" REAL NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProcessGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InstrumentConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "tickValue" REAL NOT NULL,
    "tickSize" REAL NOT NULL,
    "pointValue" REAL
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York'
);

-- CreateTable
CREATE TABLE "_RuleViolationChecklistItemToTradingDay" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RuleViolationChecklistItemToTradingDay_A_fkey" FOREIGN KEY ("A") REFERENCES "RuleViolationChecklistItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RuleViolationChecklistItemToTradingDay_B_fkey" FOREIGN KEY ("B") REFERENCES "TradingDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TradeConfluenceFactors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TradeConfluenceFactors_A_fkey" FOREIGN KEY ("A") REFERENCES "ConfluenceFactor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TradeConfluenceFactors_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MissedTradeConfluenceFactors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MissedTradeConfluenceFactors_A_fkey" FOREIGN KEY ("A") REFERENCES "ConfluenceFactor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MissedTradeConfluenceFactors_B_fkey" FOREIGN KEY ("B") REFERENCES "MissedTrade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TradeMistakes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TradeMistakes_A_fkey" FOREIGN KEY ("A") REFERENCES "MistakeType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TradeMistakes_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TradingDay_date_key" ON "TradingDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "RuleViolationChecklistItem_label_key" ON "RuleViolationChecklistItem"("label");

-- CreateIndex
CREATE UNIQUE INDEX "ConfluenceFactor_label_key" ON "ConfluenceFactor"("label");

-- CreateIndex
CREATE UNIQUE INDEX "EntryModel_label_key" ON "EntryModel"("label");

-- CreateIndex
CREATE UNIQUE INDEX "TradeSession_label_key" ON "TradeSession"("label");

-- CreateIndex
CREATE UNIQUE INDEX "MistakeType_label_key" ON "MistakeType"("label");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentConfig_symbol_key" ON "InstrumentConfig"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "_RuleViolationChecklistItemToTradingDay_AB_unique" ON "_RuleViolationChecklistItemToTradingDay"("A", "B");

-- CreateIndex
CREATE INDEX "_RuleViolationChecklistItemToTradingDay_B_index" ON "_RuleViolationChecklistItemToTradingDay"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TradeConfluenceFactors_AB_unique" ON "_TradeConfluenceFactors"("A", "B");

-- CreateIndex
CREATE INDEX "_TradeConfluenceFactors_B_index" ON "_TradeConfluenceFactors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MissedTradeConfluenceFactors_AB_unique" ON "_MissedTradeConfluenceFactors"("A", "B");

-- CreateIndex
CREATE INDEX "_MissedTradeConfluenceFactors_B_index" ON "_MissedTradeConfluenceFactors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TradeMistakes_AB_unique" ON "_TradeMistakes"("A", "B");

-- CreateIndex
CREATE INDEX "_TradeMistakes_B_index" ON "_TradeMistakes"("B");

-- CreateTable
CREATE TABLE "PreMarketAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "instrument" TEXT NOT NULL,
    "htfBiasAnalysis" TEXT NOT NULL,
    "htfBiasConfidence" REAL NOT NULL,
    "liquidityAnalysis" TEXT NOT NULL,
    "fvgAnalysis" TEXT NOT NULL,
    "premiumDiscountZone" TEXT NOT NULL,
    "premiumDiscountNotes" TEXT NOT NULL,
    "bullishPct" REAL NOT NULL,
    "bearishPct" REAL NOT NULL,
    "rangePct" REAL NOT NULL,
    "overallBias" TEXT NOT NULL,
    "biasConfidence" REAL NOT NULL,
    "biasReasoning" TEXT NOT NULL,
    "expectedNarrative" TEXT NOT NULL,
    "invalidationLevel" TEXT NOT NULL,
    "primaryTarget" TEXT NOT NULL,
    "secondaryTarget" TEXT NOT NULL,
    "tradeable" BOOLEAN NOT NULL,
    "noTradeReason" TEXT,
    "tradeScenarios" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PreMarketScreenshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreMarketScreenshot_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PreMarketAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreMarketReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "actualPriceActionSummary" TEXT NOT NULL,
    "biasCorrect" BOOLEAN NOT NULL,
    "biasAccuracyScore" REAL NOT NULL,
    "biasNotes" TEXT NOT NULL,
    "liquidityAccuracyScore" REAL NOT NULL,
    "liquidityNotes" TEXT NOT NULL,
    "fvgAccuracyScore" REAL NOT NULL,
    "fvgNotes" TEXT NOT NULL,
    "targetAccuracyScore" REAL NOT NULL,
    "targetNotes" TEXT NOT NULL,
    "narrativeAccuracyScore" REAL NOT NULL,
    "narrativeNotes" TEXT NOT NULL,
    "overallAccuracyScore" REAL NOT NULL,
    "overallSummary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreMarketReview_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PreMarketAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradingViewLayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrument" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "url" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PreMarketAnalysis_date_instrument_key" ON "PreMarketAnalysis"("date", "instrument");

-- CreateIndex
CREATE UNIQUE INDEX "PreMarketReview_analysisId_key" ON "PreMarketReview"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "TradingViewLayout_instrument_timeframe_key" ON "TradingViewLayout"("instrument", "timeframe");

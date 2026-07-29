-- CreateTable
CREATE TABLE "TradingDayScreenshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradingDayId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradingDayScreenshot_tradingDayId_fkey" FOREIGN KEY ("tradingDayId") REFERENCES "TradingDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

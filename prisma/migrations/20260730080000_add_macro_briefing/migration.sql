-- CreateTable
CREATE TABLE "MacroBriefing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "asOf" TEXT,
    "macroTone" TEXT NOT NULL,
    "economicCalendarToday" TEXT NOT NULL,
    "weekAhead" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "MacroBriefing_date_key" ON "MacroBriefing"("date");

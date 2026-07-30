-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MacroBriefing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "asOf" TEXT,
    "macroTone" TEXT NOT NULL,
    "economicCalendarToday" TEXT NOT NULL,
    "weekAhead" TEXT NOT NULL,
    "trumpAppearancesToday" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MacroBriefing" ("asOf", "createdAt", "date", "economicCalendarToday", "id", "macroTone", "weekAhead") SELECT "asOf", "createdAt", "date", "economicCalendarToday", "id", "macroTone", "weekAhead" FROM "MacroBriefing";
DROP TABLE "MacroBriefing";
ALTER TABLE "new_MacroBriefing" RENAME TO "MacroBriefing";
CREATE UNIQUE INDEX "MacroBriefing_date_key" ON "MacroBriefing"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

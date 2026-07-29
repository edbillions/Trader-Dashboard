-- CreateTable
CREATE TABLE "LifeGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "targetValue" REAL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'increase',
    "targetDate" DATETIME,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

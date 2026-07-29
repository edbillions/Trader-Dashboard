-- CreateTable
CREATE TABLE "ChartImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "title" TEXT,
    "symbol" TEXT,
    "grade" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

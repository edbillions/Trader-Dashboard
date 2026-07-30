-- AlterTable
ALTER TABLE "MissedTrade" ADD COLUMN "estimatedRMultiple" REAL;

-- CreateTable
CREATE TABLE "TagCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "TagOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "TagOption_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TagCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PeriodReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "rating" INTEGER,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_TradeTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TradeTags_A_fkey" FOREIGN KEY ("A") REFERENCES "TagOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TradeTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TagCategory_name_key" ON "TagCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_TradeTags_AB_unique" ON "_TradeTags"("A", "B");

-- CreateIndex
CREATE INDEX "_TradeTags_B_index" ON "_TradeTags"("B");

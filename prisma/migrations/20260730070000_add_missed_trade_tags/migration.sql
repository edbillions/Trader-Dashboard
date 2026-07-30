-- CreateTable
CREATE TABLE "_MissedTradeTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MissedTradeTags_A_fkey" FOREIGN KEY ("A") REFERENCES "MissedTrade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MissedTradeTags_B_fkey" FOREIGN KEY ("B") REFERENCES "TagOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_MissedTradeTags_AB_unique" ON "_MissedTradeTags"("A", "B");

-- CreateIndex
CREATE INDEX "_MissedTradeTags_B_index" ON "_MissedTradeTags"("B");

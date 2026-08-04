"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { DataCategoryKey } from "@/lib/data/data-clear";

// Settings > Danger Zone. Plain-arg action (client-driven checklist +
// typed-confirmation gate lives in the component, not a form submit) —
// matches the useTransition-driven action convention used elsewhere
// (e.g. toggleTradeReviewedAction) for client-tap-triggered actions.
export async function clearDataAction(categories: DataCategoryKey[]): Promise<void> {
  const selected = new Set(categories);

  // Clear the FK from Trade -> PropFirmAccount first whenever accounts are
  // being wiped, regardless of whether "trades" is also selected — avoids a
  // foreign-key error either way, and is a no-op if there are no trades.
  if (selected.has("propFirms")) {
    await prisma.trade.updateMany({
      where: { accountId: { not: null } },
      data: { accountId: null },
    });
  }

  if (selected.has("trades")) {
    // Cascades Trade, MissedTrade, Screenshot, and TradingDayScreenshot.
    await prisma.tradingDay.deleteMany({});
  }
  if (selected.has("reviews")) {
    await prisma.periodReview.deleteMany({});
  }
  if (selected.has("goals")) {
    await prisma.lifeGoal.deleteMany({});
    await prisma.goal.deleteMany({});
    await prisma.processGoal.deleteMany({});
  }
  if (selected.has("todos")) {
    await prisma.todoItem.deleteMany({});
  }
  if (selected.has("habitLogs")) {
    await prisma.habitLog.deleteMany({});
  }
  if (selected.has("notebook")) {
    await prisma.notebookEntry.deleteMany({});
    // Cascades NotebookNote.
    await prisma.notebookFolder.deleteMany({});
  }
  if (selected.has("chartVault")) {
    await prisma.chartImage.deleteMany({});
  }
  if (selected.has("propFirms")) {
    // Cascades AccountExpense, AccountPayout.
    await prisma.propFirmAccount.deleteMany({});
  }
  if (selected.has("premarket")) {
    // Cascades PreMarketScreenshot, PreMarketReview. Leaves
    // TradingViewLayout untouched (that's chart-layout configuration).
    await prisma.preMarketAnalysis.deleteMany({});
  }
  if (selected.has("tendencies")) {
    await prisma.tendency.deleteMany({});
  }
  if (selected.has("macroBriefings")) {
    await prisma.macroBriefing.deleteMany({});
  }

  for (const path of [
    "/settings",
    "/dashboard",
    "/trades",
    "/journal",
    "/reviews",
    "/goals",
    "/todo",
    "/schedule",
    "/notebook",
    "/chart-vault",
    "/prop-firms",
    "/premarket",
    "/tendencies",
    "/live-session",
    "/calendar",
    "/analytics",
    "/coach",
    "/mistakes",
  ]) {
    revalidatePath(path);
  }
}

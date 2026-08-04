import { prisma } from "@/lib/prisma";

// Settings > Danger Zone: lets the trader wipe categories of their own
// inputted data independently, keeping configuration (API key, timezone,
// tag categories, entry models, confluence factors, mistake types,
// instrument configs, TradingView layouts, habit definitions) untouched
// regardless of what's selected.

export interface DataCategory {
  key: string;
  label: string;
  description: string;
}

export const DATA_CATEGORIES: DataCategory[] = [
  {
    key: "trades",
    label: "Trades & Journal",
    description:
      "All trading days, trades, missed trades, and journal/plan screenshots.",
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "Weekly, monthly, quarterly, and yearly period reviews.",
  },
  {
    key: "goals",
    label: "Goals",
    description: "Life goals plus weekly/monthly/yearly and process goals.",
  },
  {
    key: "todos",
    label: "To-Do",
    description: "All to-do items.",
  },
  {
    key: "habitLogs",
    label: "Habit Logs",
    description: "Daily habit check-ins — keeps your habit list itself.",
  },
  {
    key: "notebook",
    label: "Notebook",
    description: "Daily notes and folder notes — keeps nothing else.",
  },
  {
    key: "chartVault",
    label: "Chart Vault",
    description: "Saved chart images.",
  },
  {
    key: "propFirms",
    label: "Prop Firm Accounts",
    description: "Accounts, expenses, and payouts. Trades keep their data but lose their account link.",
  },
  {
    key: "premarket",
    label: "Pre-Market Analyst",
    description: "Saved AI pre-market analyses and reviews — keeps your TradingView chart layouts.",
  },
  {
    key: "tendencies",
    label: "Tendencies",
    description: "Tracked behavioral tendencies.",
  },
  {
    key: "macroBriefings",
    label: "Macro Briefings",
    description: "Cached AI macro briefings.",
  },
];

export type DataCategoryKey = (typeof DATA_CATEGORIES)[number]["key"];

export async function getDataClearCounts(): Promise<Record<DataCategoryKey, number>> {
  const [
    tradingDays,
    reviews,
    lifeGoals,
    goals,
    processGoals,
    todos,
    habitLogs,
    notebookEntries,
    notebookFolders,
    chartImages,
    propFirmAccounts,
    preMarketAnalyses,
    tendencies,
    macroBriefings,
  ] = await Promise.all([
    prisma.tradingDay.count(),
    prisma.periodReview.count(),
    prisma.lifeGoal.count(),
    prisma.goal.count(),
    prisma.processGoal.count(),
    prisma.todoItem.count(),
    prisma.habitLog.count(),
    prisma.notebookEntry.count(),
    prisma.notebookFolder.count(),
    prisma.chartImage.count(),
    prisma.propFirmAccount.count(),
    prisma.preMarketAnalysis.count(),
    prisma.tendency.count(),
    prisma.macroBriefing.count(),
  ]);

  return {
    trades: tradingDays,
    reviews,
    goals: lifeGoals + goals + processGoals,
    todos,
    habitLogs,
    notebook: notebookEntries + notebookFolders,
    chartVault: chartImages,
    propFirms: propFirmAccounts,
    premarket: preMarketAnalyses,
    tendencies,
    macroBriefings,
  };
}

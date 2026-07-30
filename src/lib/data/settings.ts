import { prisma } from "@/lib/prisma";

export async function getSettingsData() {
  const [
    settings,
    entryModels,
    confluenceFactors,
    sessions,
    mistakeTypes,
    ruleViolations,
    instruments,
    tagCategories,
    tradingViewLayouts,
  ] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: 1 } }),
    prisma.entryModel.findMany({ orderBy: { label: "asc" } }),
    prisma.confluenceFactor.findMany({ orderBy: { label: "asc" } }),
    prisma.tradeSession.findMany({ orderBy: { label: "asc" } }),
    prisma.mistakeType.findMany({ orderBy: { label: "asc" } }),
    prisma.ruleViolationChecklistItem.findMany({ orderBy: { label: "asc" } }),
    prisma.instrumentConfig.findMany({ orderBy: { symbol: "asc" } }),
    prisma.tagCategory.findMany({
      orderBy: { order: "asc" },
      include: { tags: { orderBy: { label: "asc" } } },
    }),
    prisma.tradingViewLayout.findMany({
      orderBy: [{ instrument: "asc" }, { timeframe: "asc" }],
    }),
  ]);

  return {
    settings,
    entryModels,
    confluenceFactors,
    sessions,
    mistakeTypes,
    ruleViolations,
    instruments,
    tagCategories,
    tradingViewLayouts,
  };
}

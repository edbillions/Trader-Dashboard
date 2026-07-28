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
  ] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: 1 } }),
    prisma.entryModel.findMany({ orderBy: { label: "asc" } }),
    prisma.confluenceFactor.findMany({ orderBy: { label: "asc" } }),
    prisma.tradeSession.findMany({ orderBy: { label: "asc" } }),
    prisma.mistakeType.findMany({ orderBy: { label: "asc" } }),
    prisma.ruleViolationChecklistItem.findMany({ orderBy: { label: "asc" } }),
    prisma.instrumentConfig.findMany({ orderBy: { symbol: "asc" } }),
  ]);

  return {
    settings,
    entryModels,
    confluenceFactors,
    sessions,
    mistakeTypes,
    ruleViolations,
    instruments,
  };
}

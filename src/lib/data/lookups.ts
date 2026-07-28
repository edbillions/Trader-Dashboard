import { prisma } from "@/lib/prisma";

export async function getWizardLookups() {
  const [
    entryModels,
    confluenceFactors,
    sessions,
    mistakeTypes,
    ruleViolations,
    instruments,
    accounts,
  ] = await Promise.all([
    prisma.entryModel.findMany({
      where: { active: true },
      orderBy: { label: "asc" },
    }),
    prisma.confluenceFactor.findMany({
      where: { active: true },
      orderBy: { label: "asc" },
    }),
    prisma.tradeSession.findMany({
      where: { active: true },
      orderBy: { label: "asc" },
    }),
    prisma.mistakeType.findMany({
      where: { active: true },
      orderBy: { label: "asc" },
    }),
    prisma.ruleViolationChecklistItem.findMany({
      where: { active: true },
      orderBy: { label: "asc" },
    }),
    prisma.instrumentConfig.findMany({ orderBy: { symbol: "asc" } }),
    prisma.propFirmAccount.findMany({
      where: { status: "active" },
      orderBy: { firmName: "asc" },
    }),
  ]);

  return {
    entryModels,
    confluenceFactors,
    sessions,
    mistakeTypes,
    ruleViolations,
    instruments,
    accounts,
  };
}

export type WizardLookups = Awaited<ReturnType<typeof getWizardLookups>>;

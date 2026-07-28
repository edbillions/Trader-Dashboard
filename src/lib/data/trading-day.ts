import { prisma } from "@/lib/prisma";
import type { SaveTradingDayInput } from "@/lib/types/journal";

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function toDatetimeLocal(d: Date | null) {
  if (!d) return null;
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export async function listTradingDays(limit = 30) {
  const days = await prisma.tradingDay.findMany({
    orderBy: { date: "desc" },
    take: limit,
    include: {
      trades: { select: { netPnl: true } },
    },
  });

  return days.map((day) => ({
    id: day.id,
    date: toDateKey(day.date),
    tradeCount: day.trades.length,
    netPnl: day.trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0),
    planAdherenceGrade: day.planAdherenceGrade,
  }));
}

export async function getTradingDayInputForDate(
  date: string,
): Promise<SaveTradingDayInput | null> {
  const dateOnly = new Date(`${date}T00:00:00`);
  const day = await prisma.tradingDay.findUnique({
    where: { date: dateOnly },
    include: {
      ruleViolations: true,
      trades: {
        include: { confluenceFactors: true, mistakes: true, screenshots: true },
      },
      missedTrades: { include: { confluenceFactors: true } },
    },
  });

  if (!day) return null;

  return {
    date,
    htfBias: day.htfBias ?? "",
    keyLevels: day.keyLevels ?? "",
    sessionTiming: day.sessionTiming ?? "",
    news: day.news ?? "",
    maxLossPlan: day.maxLossPlan,
    positionSizePlan: day.positionSizePlan ?? "",
    maxTradeCountPlan: day.maxTradeCountPlan,
    planAdherenceGrade: day.planAdherenceGrade ?? "",
    psychologyLog: day.psychologyLog ?? "",
    freeformNotes: day.freeformNotes ?? "",
    ruleViolationIds: day.ruleViolations.map((r) => r.id),
    trades: day.trades.map((t) => ({
      id: t.id,
      accountId: t.accountId,
      symbol: t.symbol,
      direction: t.direction as "long" | "short",
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      entryTime: toDatetimeLocal(t.entryTime) ?? "",
      exitTime: toDatetimeLocal(t.exitTime),
      stopLossPlanned: t.stopLossPlanned,
      stopLossActual: t.stopLossActual,
      targetPlanned: t.targetPlanned,
      targetActual: t.targetActual,
      positionSize: t.positionSize,
      commission: t.commission,
      htfTimeframe: t.htfTimeframe ?? "",
      intermediateTimeframe: t.intermediateTimeframe ?? "",
      entryTimeframe: t.entryTimeframe ?? "",
      entryModel: t.entryModel ?? "",
      session: t.session ?? "",
      setupGrade: t.setupGrade ?? "",
      dailyBias: t.dailyBias ?? "",
      htfPoi: t.htfPoi ?? "",
      htfDol: t.htfDol ?? "",
      writeup: t.writeup ?? "",
      confluenceFactorIds: t.confluenceFactors.map((c) => c.id),
      mistakeIds: t.mistakes.map((m) => m.id),
      screenshotPaths: t.screenshots.map((s) => s.filePath),
    })),
    missedTrades: day.missedTrades.map((m) => ({
      id: m.id,
      symbol: m.symbol,
      setupDescription: m.setupDescription ?? "",
      reasonMissed: m.reasonMissed ?? "",
      entryModel: m.entryModel ?? "",
      session: m.session ?? "",
      confluenceFactorIds: m.confluenceFactors.map((c) => c.id),
    })),
  };
}

export async function getTradingDayDetail(date: string) {
  const dateOnly = new Date(`${date}T00:00:00`);
  const day = await prisma.tradingDay.findUnique({
    where: { date: dateOnly },
    include: {
      ruleViolations: true,
      trades: {
        include: { confluenceFactors: true, mistakes: true, screenshots: true },
        orderBy: { entryTime: "asc" },
      },
      missedTrades: { include: { confluenceFactors: true } },
    },
  });

  return day;
}

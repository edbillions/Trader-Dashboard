import { prisma } from "@/lib/prisma";
import type { SaveTradingDayInput } from "@/lib/types/journal";
import { parsePreMarketChecklist } from "@/lib/types/premarket-checklist";
import { parseScorecard } from "@/lib/types/scorecard";
import { parseSetupFactorsChecklist } from "@/lib/types/setup-factors-checklist";

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function toDatetimeLocal(d: Date | null) {
  if (!d) return null;
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// Find-or-create the TradingDay row for a given date key, normalized to
// local midnight — same convention as every other date lookup in this file.
// Shared by the Live Session actions, which need a day row to attach
// Quick Log trades / session state to without going through the full-day
// upsert in saveTradingDayAction.
export async function findOrCreateTradingDay(dateKey: string) {
  const dateOnly = new Date(`${dateKey}T00:00:00`);
  return prisma.tradingDay.upsert({
    where: { date: dateOnly },
    update: {},
    create: { date: dateOnly },
  });
}

export async function listTradingDays(limit = 30) {
  const days = await prisma.tradingDay.findMany({
    orderBy: { date: "desc" },
    take: limit,
    include: {
      trades: { select: { netPnl: true }, orderBy: { entryTime: "asc" } },
    },
  });

  return days.map((day) => {
    // Anchored at 0 — every day genuinely starts at $0 P&L before the first
    // trade, so even a single-trade day gets a real two-point line (0 ->
    // final P&L) instead of a single dot with nothing to draw.
    let cumulative = 0;
    const series = [
      0,
      ...day.trades.map((t) => {
        cumulative += t.netPnl ?? 0;
        return Math.round(cumulative * 100) / 100;
      }),
    ];

    return {
      id: day.id,
      date: toDateKey(day.date),
      tradeCount: day.trades.length,
      netPnl: cumulative,
      planAdherenceGrade: day.planAdherenceGrade,
      series,
    };
  });
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
        include: {
          confluenceFactors: true,
          mistakes: true,
          screenshots: true,
          tags: true,
        },
      },
      missedTrades: { include: { confluenceFactors: true, tags: true } },
      planScreenshots: true,
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
    planScreenshotPaths: day.planScreenshots
      .filter((s) => !s.kind)
      .map((s) => s.filePath),
    dailyChartScreenshotPath:
      day.planScreenshots.find((s) => s.kind === "daily")?.filePath ?? null,
    htf4hChartScreenshotPath:
      day.planScreenshots.find((s) => s.kind === "htf4h")?.filePath ?? null,
    mtf15mChartScreenshotPath:
      day.planScreenshots.find((s) => s.kind === "mtf15m")?.filePath ?? null,
    preMarketChecklist: parsePreMarketChecklist(day.preMarketChecklist),
    planAdherenceGrade: day.planAdherenceGrade ?? "",
    psychologyLog: day.psychologyLog ?? "",
    freeformNotes: day.freeformNotes ?? "",
    scorecard: parseScorecard(day.scorecard),
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
      htfChartLink: t.htfChartLink ?? "",
      intermediateChartLink: t.intermediateChartLink ?? "",
      entryChartLink: t.entryChartLink ?? "",
      entryTimeframe: t.entryTimeframe ?? "",
      entryModel: t.entryModel ?? "",
      session: t.session ?? "",
      setupGrade: t.setupGrade ?? "",
      dailyBias: t.dailyBias ?? "",
      htfPoi: t.htfPoi ?? "",
      htfDol: t.htfDol ?? "",
      setupFactors: parseSetupFactorsChecklist(t.setupFactorsChecklist),
      mfeR: t.mfeR,
      maeR: t.maeR,
      writeup: t.writeup ?? "",
      confluenceFactorIds: t.confluenceFactors.map((c) => c.id),
      mistakeIds: t.mistakes.map((m) => m.id),
      tagIds: t.tags.map((tag) => tag.id),
      screenshotPaths: t.screenshots.map((s) => s.filePath),
      quickLogged: t.quickLogged,
    })),
    missedTrades: day.missedTrades.map((m) => ({
      id: m.id,
      symbol: m.symbol,
      setupDescription: m.setupDescription ?? "",
      reasonMissed: m.reasonMissed ?? "",
      entryModel: m.entryModel ?? "",
      session: m.session ?? "",
      estimatedRMultiple: m.estimatedRMultiple,
      confluenceFactorIds: m.confluenceFactors.map((c) => c.id),
      tagIds: m.tags.map((tag) => tag.id),
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
        include: { confluenceFactors: true, mistakes: true, screenshots: true, tags: true },
        orderBy: { entryTime: "asc" },
      },
      missedTrades: { include: { confluenceFactors: true } },
      planScreenshots: true,
    },
  });

  return day;
}

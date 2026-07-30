import { prisma } from "@/lib/prisma";
import { computeDayDisciplineScore } from "@/lib/domain/discipline";
import { computeCompositeScore } from "@/lib/domain/composite-score";
import { computeTradeStats, computeMonthlyPnl } from "@/lib/domain/trade-stats";

export interface GroupStat {
  label: string;
  count: number;
  winRate: number | null;
  netPnl: number;
  avgR: number | null;
}

interface TradeLike {
  netPnl: number | null;
  rMultiple: number | null;
}

export function groupStats<T extends TradeLike>(
  trades: T[],
  keyFn: (t: T) => string | null,
): GroupStat[] {
  const groups = new Map<string, T[]>();
  for (const t of trades) {
    const key = keyFn(t);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  return Array.from(groups.entries())
    .map(([label, group]) => {
      const wins = group.filter((t) => (t.netPnl ?? 0) > 0).length;
      const losses = group.filter((t) => (t.netPnl ?? 0) < 0).length;
      const rValues = group
        .map((t) => t.rMultiple)
        .filter((r): r is number => r != null);

      return {
        label,
        count: group.length,
        winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : null,
        netPnl: group.reduce((s, t) => s + (t.netPnl ?? 0), 0),
        avgR:
          rValues.length > 0
            ? rValues.reduce((a, b) => a + b, 0) / rValues.length
            : null,
      };
    })
    .sort((a, b) => b.netPnl - a.netPnl);
}

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function getAnalyticsData() {
  const [trades, tradingDays] = await Promise.all([
    prisma.trade.findMany({
      include: {
        confluenceFactors: true,
        tradingDay: { select: { date: true, news: true } },
      },
    }),
    prisma.tradingDay.findMany({
      include: {
        ruleViolations: { select: { id: true } },
        trades: { select: { netPnl: true, setupGrade: true } },
      },
    }),
  ]);

  const wins = trades.filter((t) => (t.netPnl ?? 0) > 0);
  const losses = trades.filter((t) => (t.netPnl ?? 0) < 0);
  const grossProfit = wins.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.netPnl ?? 0), 0));
  const winRate =
    wins.length + losses.length > 0
      ? (wins.length / (wins.length + losses.length)) * 100
      : null;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : null;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : null;
  const avgWinLossRatio =
    avgWin != null && avgLoss != null && avgLoss > 0 ? avgWin / avgLoss : null;

  const disciplineScores = tradingDays
    .map((day) =>
      computeDayDisciplineScore({
        planAdherenceGrade: day.planAdherenceGrade,
        maxLossPlan: day.maxLossPlan,
        ruleViolationCount: day.ruleViolations.length,
        trades: day.trades,
      }),
    )
    .filter((s): s is number => s != null);
  const disciplineScore =
    disciplineScores.length > 0
      ? disciplineScores.reduce((a, b) => a + b, 0) / disciplineScores.length
      : null;

  const composite = computeCompositeScore({
    winRate,
    profitFactor,
    avgWinLossRatio,
    disciplineScore,
  });

  const byDayOfWeek = groupStats(trades, (t) =>
    WEEKDAY_LABELS[t.entryTime.getDay()],
  );
  const byHour = groupStats(trades, (t) => {
    const h = t.entryTime.getHours();
    return `${h.toString().padStart(2, "0")}:00`;
  });
  const bySymbol = groupStats(trades, (t) => t.symbol);
  const byNewsDay = groupStats(trades, (t) =>
    t.tradingDay.news ? "News day" : "No news",
  );
  const byTimeframe = groupStats(trades, (t) => t.entryTimeframe);
  const byEntryModel = groupStats(trades, (t) => t.entryModel);
  const bySession = groupStats(trades, (t) => t.session);
  const bySetupGrade = groupStats(trades, (t) => t.setupGrade);

  const confluenceGroups = new Map<string, typeof trades>();
  for (const t of trades) {
    for (const factor of t.confluenceFactors) {
      if (!confluenceGroups.has(factor.label)) {
        confluenceGroups.set(factor.label, []);
      }
      confluenceGroups.get(factor.label)!.push(t);
    }
  }
  const byConfluenceFactor = Array.from(confluenceGroups.entries())
    .map(([label, group]) => groupStats(group, () => label)[0])
    .sort((a, b) => b.netPnl - a.netPnl);

  const excursionTrades = trades.filter(
    (t) => t.mfeR != null && t.rMultiple != null,
  );
  const avgMfeR =
    excursionTrades.length > 0
      ? excursionTrades.reduce((s, t) => s + (t.mfeR ?? 0), 0) /
        excursionTrades.length
      : null;
  const maeTrades = trades.filter((t) => t.maeR != null);
  const avgMaeR =
    maeTrades.length > 0
      ? maeTrades.reduce((s, t) => s + (t.maeR ?? 0), 0) / maeTrades.length
      : null;
  const avgRealizedR =
    excursionTrades.length > 0
      ? excursionTrades.reduce((s, t) => s + (t.rMultiple ?? 0), 0) /
        excursionTrades.length
      : null;
  const captureRate =
    avgRealizedR != null && avgMfeR != null && avgMfeR > 0
      ? (avgRealizedR / avgMfeR) * 100
      : null;

  const excursion = {
    sampleSize: excursionTrades.length,
    avgMfeR,
    avgMaeR,
    avgRealizedR,
    captureRate,
  };

  const stats = computeTradeStats(trades, tradingDays);
  const monthlyPnl = computeMonthlyPnl(trades);

  return {
    totals: {
      tradeCount: trades.length,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      avgWinLossRatio,
      disciplineScore,
    },
    composite,
    breakdowns: {
      byDayOfWeek,
      byHour,
      bySymbol,
      byNewsDay,
      byTimeframe,
      byEntryModel,
      bySession,
      bySetupGrade,
      byConfluenceFactor,
    },
    excursion,
    stats,
    monthlyPnl,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;

import { computeTradeStreaks } from "@/lib/domain/streaks";

export interface TradeStatsTradeInput {
  netPnl: number | null;
  rMultiple: number | null;
  positionSize: number;
  commission: number | null;
  entryTime: Date;
  exitTime: Date | null;
  exitPrice: number | null;
  entryPrice: number;
  stopLossPlanned: number | null;
  targetPlanned: number | null;
  direction: string;
}

export interface TradeStatsDayInput {
  date: Date;
  trades: { netPnl: number | null }[];
}

function avg(values: number[]): number | null {
  return values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}

function plannedR(t: TradeStatsTradeInput): number | null {
  if (t.stopLossPlanned == null || t.targetPlanned == null) return null;
  const risk = Math.abs(t.entryPrice - t.stopLossPlanned);
  const reward = Math.abs(t.targetPlanned - t.entryPrice);
  return risk > 0 ? reward / risk : null;
}

export function computeTradeStats(
  trades: TradeStatsTradeInput[],
  tradingDays: TradeStatsDayInput[],
) {
  const closedTrades = trades.filter((t) => t.netPnl != null);
  const openTrades = trades.filter((t) => t.exitPrice == null);

  const wins = closedTrades.filter((t) => (t.netPnl ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.netPnl ?? 0) < 0);
  const breakeven = closedTrades.filter((t) => (t.netPnl ?? 0) === 0);

  const totalPnl = closedTrades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const grossProfit = wins.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.netPnl ?? 0), 0));
  const winRate =
    wins.length + losses.length > 0
      ? (wins.length / (wins.length + losses.length)) * 100
      : null;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : null;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : null;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;
  const avgTradePnl = closedTrades.length > 0 ? totalPnl / closedTrades.length : null;

  const tradeExpectancy =
    winRate != null && avgWin != null && avgLoss != null
      ? (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss
      : null;

  const chronoTrades = [...trades].sort(
    (a, b) => a.entryTime.getTime() - b.entryTime.getTime(),
  );
  const tradeStreaks = computeTradeStreaks(chronoTrades);

  const totalCommissions = trades.reduce(
    (s, t) => s + Math.abs(t.commission ?? 0),
    0,
  );

  const largestProfit =
    wins.length > 0 ? Math.max(...wins.map((t) => t.netPnl ?? 0)) : null;
  const largestLoss =
    losses.length > 0 ? Math.min(...losses.map((t) => t.netPnl ?? 0)) : null;

  const holdMinutes = (t: TradeStatsTradeInput) =>
    t.exitTime != null
      ? (t.exitTime.getTime() - t.entryTime.getTime()) / 60000
      : null;
  const allHolds = trades.map(holdMinutes).filter((m): m is number => m != null);
  const winHolds = wins.map(holdMinutes).filter((m): m is number => m != null);
  const lossHolds = losses.map(holdMinutes).filter((m): m is number => m != null);

  const positionSizeByDay = new Map<string, number>();
  for (const t of trades) {
    const key = t.entryTime.toISOString().slice(0, 10);
    positionSizeByDay.set(key, (positionSizeByDay.get(key) ?? 0) + t.positionSize);
  }

  const plannedRValues = trades
    .map(plannedR)
    .filter((r): r is number => r != null);
  const realizedRValues = trades
    .map((t) => t.rMultiple)
    .filter((r): r is number => r != null);

  // ---------- Day-level ----------

  const loggedDays = tradingDays.length;
  const daysWithTrades = tradingDays.filter((d) => d.trades.length > 0);
  const dayNetPnls = daysWithTrades.map((d) => ({
    date: d.date,
    netPnl: d.trades.reduce((s, t) => s + (t.netPnl ?? 0), 0),
  }));

  const winningDays = dayNetPnls.filter((d) => d.netPnl > 0);
  const losingDays = dayNetPnls.filter((d) => d.netPnl < 0);
  const breakevenDays = dayNetPnls.filter((d) => d.netPnl === 0);

  const chronoDays = [...dayNetPnls].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const dayStreaks = computeTradeStreaks(chronoDays);

  return {
    totalPnl,
    avgPositionSizePerDay: avg(Array.from(positionSizeByDay.values())),
    avgWin,
    avgLoss,
    winningTradeCount: wins.length,
    losingTradeCount: losses.length,
    breakevenTradeCount: breakeven.length,
    maxConsecutiveWins: tradeStreaks.bestWinStreak,
    maxConsecutiveLosses: tradeStreaks.bestLossStreak,
    totalCommissions,
    largestProfit,
    largestLoss,
    avgHoldMinutesAll: avg(allHolds),
    avgHoldMinutesWinning: avg(winHolds),
    avgHoldMinutesLosing: avg(lossHolds),
    avgTradePnl,
    profitFactor,
    openTradesCount: openTrades.length,
    avgPlannedR: avg(plannedRValues),
    avgRealizedR: avg(realizedRValues),
    tradeExpectancy,

    loggedDays,
    totalTradingDays: daysWithTrades.length,
    winningDays: winningDays.length,
    losingDays: losingDays.length,
    breakevenDays: breakevenDays.length,
    maxConsecutiveWinningDays: dayStreaks.bestWinStreak,
    maxConsecutiveLosingDays: dayStreaks.bestLossStreak,
    avgDailyPnl: avg(dayNetPnls.map((d) => d.netPnl)),
    avgWinningDayPnl: avg(winningDays.map((d) => d.netPnl)),
    avgLosingDayPnl: avg(losingDays.map((d) => d.netPnl)),
    largestProfitableDay:
      dayNetPnls.length > 0
        ? Math.max(...dayNetPnls.map((d) => d.netPnl))
        : null,
    largestLosingDay:
      dayNetPnls.length > 0
        ? Math.min(...dayNetPnls.map((d) => d.netPnl))
        : null,
  };
}

export interface MonthlyPnl {
  label: string;
  netPnl: number;
}

export function computeMonthlyPnl(
  trades: { netPnl: number | null; entryTime: Date }[],
) {
  const byMonth = new Map<string, number>();
  for (const t of trades) {
    const key = t.entryTime.toISOString().slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + (t.netPnl ?? 0));
  }

  const months: MonthlyPnl[] = Array.from(byMonth.entries())
    .map(([label, netPnl]) => ({ label, netPnl }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (months.length === 0) {
    return { bestMonth: null, lowestMonth: null, avgPerMonth: null, months };
  }

  const bestMonth = months.reduce((best, m) => (m.netPnl > best.netPnl ? m : best));
  const lowestMonth = months.reduce((worst, m) => (m.netPnl < worst.netPnl ? m : worst));
  const avgPerMonth = avg(months.map((m) => m.netPnl));

  return { bestMonth, lowestMonth, avgPerMonth, months };
}

export interface EdgeTradeInput {
  netPnl: number | null;
  isClean: boolean;
}

export interface EdgeSummary {
  count: number;
  winRate: number | null;
  profitFactor: number | null;
  expectancy: number | null;
}

function summarize(trades: { netPnl: number | null }[]): EdgeSummary {
  const closed = trades.filter((t) => t.netPnl != null);
  const wins = closed.filter((t) => (t.netPnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.netPnl ?? 0) < 0);
  const grossProfit = wins.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.netPnl ?? 0), 0));
  const winRate =
    wins.length + losses.length > 0
      ? (wins.length / (wins.length + losses.length)) * 100
      : null;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : null;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : null;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;
  const expectancy =
    winRate != null && avgWin != null && avgLoss != null
      ? (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss
      : null;

  return { count: closed.length, winRate, profitFactor, expectancy };
}

export interface TrueSystemEdge {
  clean: EdgeSummary;
  blended: EdgeSummary;
  winRateGapPct: number | null;
}

// "Clean" = zero mistake tags AND occurred on a day with zero rule
// violations — a stricter bar than the Mistakes page's per-trade view.
export function computeTrueSystemEdge(
  trades: EdgeTradeInput[],
): TrueSystemEdge {
  const clean = summarize(trades.filter((t) => t.isClean));
  const blended = summarize(trades);

  const winRateGapPct =
    clean.winRate != null && blended.winRate != null && blended.winRate > 0
      ? ((clean.winRate - blended.winRate) / blended.winRate) * 100
      : null;

  return { clean, blended, winRateGapPct };
}

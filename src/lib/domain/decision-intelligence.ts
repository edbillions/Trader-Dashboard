export interface DecisionIntelligenceTradeInput {
  entryTime: Date;
  netPnl: number | null;
  rMultiple: number | null;
  mistakes: { label: string }[];
}

interface SubsetSummary {
  count: number;
  avgNetPnl: number | null;
  avgR: number | null;
}

export interface CohortSummary {
  count: number;
  winRate: number | null;
  netPnl: number;
  avgR: number | null;
  wins: SubsetSummary;
  losses: SubsetSummary;
  mistakeRate: number | null; // % of trades with >=1 mistake tag
}

export interface CohortTrend {
  windowSize: number; // actual trades per cohort used, may be < requested
  recent: CohortSummary;
  prior: CohortSummary;
  netPnlDelta: number;
  avgRDelta: number | null;
  winRateDelta: number | null;
  avgWinNetPnlDelta: number | null; // isolates "winners getting bigger" from win-rate changes
  avgWinRDelta: number | null;
  mistakeRateDelta: number | null;
}

const MIN_COHORT_WINDOW = 10;

function summarizeSubset(trades: DecisionIntelligenceTradeInput[]): SubsetSummary {
  if (trades.length === 0) return { count: 0, avgNetPnl: null, avgR: null };
  const rValues = trades
    .map((t) => t.rMultiple)
    .filter((r): r is number => r != null);
  return {
    count: trades.length,
    avgNetPnl: trades.reduce((s, t) => s + (t.netPnl ?? 0), 0) / trades.length,
    avgR: rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null,
  };
}

function summarizeCohort(trades: DecisionIntelligenceTradeInput[]): CohortSummary {
  const wins = trades.filter((t) => (t.netPnl ?? 0) > 0);
  const losses = trades.filter((t) => (t.netPnl ?? 0) < 0);
  const rValues = trades
    .map((t) => t.rMultiple)
    .filter((r): r is number => r != null);
  const withMistake = trades.filter((t) => t.mistakes.length > 0);

  return {
    count: trades.length,
    winRate: wins.length + losses.length > 0 ? (wins.length / (wins.length + losses.length)) * 100 : null,
    netPnl: trades.reduce((s, t) => s + (t.netPnl ?? 0), 0),
    avgR: rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null,
    wins: summarizeSubset(wins),
    losses: summarizeSubset(losses),
    mistakeRate: trades.length > 0 ? (withMistake.length / trades.length) * 100 : null,
  };
}

function diff(a: number | null, b: number | null): number | null {
  return a != null && b != null ? a - b : null;
}

// Adaptive window: uses as much of the trade history as it can while still
// keeping both cohorts a meaningful size, rather than hiding the feature
// behind a fixed 60-trade cliff — a personal journal app should still be
// able to answer this for a trader with 20-40 trades logged.
export function computeCohortTrend(
  trades: DecisionIntelligenceTradeInput[],
  requestedWindowSize = 30,
): CohortTrend | null {
  const sorted = [...trades].sort(
    (a, b) => a.entryTime.getTime() - b.entryTime.getTime(),
  );
  const windowSize = Math.min(requestedWindowSize, Math.floor(sorted.length / 2));
  if (windowSize < MIN_COHORT_WINDOW) return null;

  const recentTrades = sorted.slice(sorted.length - windowSize);
  const priorTrades = sorted.slice(sorted.length - windowSize * 2, sorted.length - windowSize);

  const recent = summarizeCohort(recentTrades);
  const prior = summarizeCohort(priorTrades);

  return {
    windowSize,
    recent,
    prior,
    netPnlDelta: recent.netPnl - prior.netPnl,
    avgRDelta: diff(recent.avgR, prior.avgR),
    winRateDelta: diff(recent.winRate, prior.winRate),
    avgWinNetPnlDelta: diff(recent.wins.avgNetPnl, prior.wins.avgNetPnl),
    avgWinRDelta: diff(recent.wins.avgR, prior.wins.avgR),
    mistakeRateDelta: diff(recent.mistakeRate, prior.mistakeRate),
  };
}

export interface ExpectancyDelta {
  mistakeLabel: string;
  taggedCount: number;
  currentExpectancy: number | null; // all trades
  withoutMistakeExpectancy: number | null; // trades not tagged with mistakeLabel
  delta: number | null;
}

function expectancyOf(trades: DecisionIntelligenceTradeInput[]): number | null {
  const wins = trades.filter((t) => (t.netPnl ?? 0) > 0);
  const losses = trades.filter((t) => (t.netPnl ?? 0) < 0);
  if (wins.length + losses.length === 0) return null;

  const winRate = wins.length / (wins.length + losses.length);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.netPnl ?? 0), 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0
      ? Math.abs(losses.reduce((s, t) => s + (t.netPnl ?? 0), 0) / losses.length)
      : 0;

  return winRate * avgWin - (1 - winRate) * avgLoss;
}

export function computeExpectancyDelta(
  trades: DecisionIntelligenceTradeInput[],
  mistakeLabel: string,
  minTaggedCount = 5,
): ExpectancyDelta | null {
  const tagged = trades.filter((t) => t.mistakes.some((m) => m.label === mistakeLabel));
  if (tagged.length < minTaggedCount) return null;

  const withoutMistake = trades.filter(
    (t) => !t.mistakes.some((m) => m.label === mistakeLabel),
  );

  const currentExpectancy = expectancyOf(trades);
  const withoutMistakeExpectancy = expectancyOf(withoutMistake);

  return {
    mistakeLabel,
    taggedCount: tagged.length,
    currentExpectancy,
    withoutMistakeExpectancy,
    delta: diff(withoutMistakeExpectancy, currentExpectancy),
  };
}

export interface FrequencyTier {
  tier: "1" | "2" | "3+";
  dayCount: number;
  avgR: number | null;
  winRate: number | null;
  avgDailyNetPnl: number | null;
  hasEnoughData: boolean;
}

const MIN_TIER_DAYS = 5;

// No verdict computed here — "trade more/less/same" is an AI output field,
// mirroring how coach-scorecard.ts lets the AI assign "tone" from numbers
// rather than deriving a verdict in domain code.
export function computeFrequencyImpact(
  tradingDays: { trades: { netPnl: number | null; rMultiple: number | null }[] }[],
): { tiers: FrequencyTier[] } {
  const buckets: Record<"1" | "2" | "3+", typeof tradingDays> = {
    "1": [],
    "2": [],
    "3+": [],
  };

  for (const day of tradingDays) {
    const count = day.trades.length;
    if (count === 0) continue;
    if (count === 1) buckets["1"].push(day);
    else if (count === 2) buckets["2"].push(day);
    else buckets["3+"].push(day);
  }

  const tiers = (["1", "2", "3+"] as const).map((tier) => {
    const days = buckets[tier];
    const allTrades = days.flatMap((d) => d.trades);
    const wins = allTrades.filter((t) => (t.netPnl ?? 0) > 0);
    const losses = allTrades.filter((t) => (t.netPnl ?? 0) < 0);
    const rValues = allTrades
      .map((t) => t.rMultiple)
      .filter((r): r is number => r != null);
    const dailyNetPnls = days.map((d) =>
      d.trades.reduce((s, t) => s + (t.netPnl ?? 0), 0),
    );

    return {
      tier,
      dayCount: days.length,
      avgR: rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null,
      winRate:
        wins.length + losses.length > 0
          ? (wins.length / (wins.length + losses.length)) * 100
          : null,
      avgDailyNetPnl:
        dailyNetPnls.length > 0
          ? dailyNetPnls.reduce((a, b) => a + b, 0) / dailyNetPnls.length
          : null,
      hasEnoughData: days.length >= MIN_TIER_DAYS,
    };
  });

  return { tiers };
}

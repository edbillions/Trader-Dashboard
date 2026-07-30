function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function subDay(d: Date) {
  const next = new Date(d);
  next.setDate(next.getDate() - 1);
  return next;
}

// Walks backward from today across weekdays only (weekends don't break a
// streak since futures traders don't typically trade them), counting while
// `predicate` holds for each day's entry. Today is skipped if not yet
// logged, so an in-progress day doesn't zero out an otherwise-intact streak.
export function computeStreak<T>(
  entriesByDate: Map<string, T>,
  predicate: (entry: T) => boolean,
): number {
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!entriesByDate.has(dateKey(cursor))) {
    cursor = subDay(cursor);
  }

  let streak = 0;
  // Safety cap so a data/logic issue can't spin forever.
  for (let i = 0; i < 3650; i++) {
    if (isWeekend(cursor)) {
      cursor = subDay(cursor);
      continue;
    }
    const entry = entriesByDate.get(dateKey(cursor));
    if (!entry || !predicate(entry)) break;
    streak++;
    cursor = subDay(cursor);
  }

  return streak;
}

// Walks backward across the trailing `windowSize` weekdays (skipping
// weekends, same as computeStreak) and counts how many have no entry at all.
// Today is excluded so an in-progress day doesn't count as a miss.
export function computeMissedWeekdays<T>(
  entriesByDate: Map<string, T>,
  windowSize: number,
): number {
  let cursor = subDay(new Date());
  cursor.setHours(0, 0, 0, 0);

  let missed = 0;
  let checked = 0;
  for (let i = 0; i < 3650 && checked < windowSize; i++) {
    if (isWeekend(cursor)) {
      cursor = subDay(cursor);
      continue;
    }
    if (!entriesByDate.has(dateKey(cursor))) missed++;
    checked++;
    cursor = subDay(cursor);
  }

  return missed;
}

export interface TradeStreakSummary {
  currentType: "win" | "loss" | null;
  currentCount: number;
  bestWinStreak: number;
  bestLossStreak: number;
  avgStreakLength: number;
}

// Expects trades in chronological order (oldest first). Breakeven/null
// netPnl trades are skipped — they don't break or extend a streak.
export function computeTradeStreaks(
  trades: { netPnl: number | null }[],
): TradeStreakSummary {
  const outcomes = trades
    .map((t) =>
      t.netPnl == null || t.netPnl === 0
        ? null
        : t.netPnl > 0
          ? ("win" as const)
          : ("loss" as const),
    )
    .filter((o): o is "win" | "loss" => o !== null);

  if (outcomes.length === 0) {
    return {
      currentType: null,
      currentCount: 0,
      bestWinStreak: 0,
      bestLossStreak: 0,
      avgStreakLength: 0,
    };
  }

  const runs: { type: "win" | "loss"; length: number }[] = [];
  let runType = outcomes[0];
  let runLength = 1;
  for (let i = 1; i < outcomes.length; i++) {
    if (outcomes[i] === runType) {
      runLength++;
    } else {
      runs.push({ type: runType, length: runLength });
      runType = outcomes[i];
      runLength = 1;
    }
  }
  runs.push({ type: runType, length: runLength });

  const bestWinStreak = Math.max(
    0,
    ...runs.filter((r) => r.type === "win").map((r) => r.length),
  );
  const bestLossStreak = Math.max(
    0,
    ...runs.filter((r) => r.type === "loss").map((r) => r.length),
  );
  const avgStreakLength =
    runs.reduce((s, r) => s + r.length, 0) / runs.length;

  const lastRun = runs[runs.length - 1];

  return {
    currentType: lastRun.type,
    currentCount: lastRun.length,
    bestWinStreak,
    bestLossStreak,
    avgStreakLength: Math.round(avgStreakLength * 10) / 10,
  };
}

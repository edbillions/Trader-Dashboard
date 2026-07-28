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

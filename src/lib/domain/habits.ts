export interface ScheduleBlock {
  start: number; // minutes since midnight
  end: number; // minutes since midnight
  label: string;
  note?: string;
}

export function getActiveScheduleBlock(
  blocks: ScheduleBlock[],
  nowMinutes: number,
): ScheduleBlock | null {
  return (
    blocks.find((b) => nowMinutes >= b.start && nowMinutes < b.end) ?? null
  );
}

export function getNextScheduleBlock(
  blocks: ScheduleBlock[],
  nowMinutes: number,
): ScheduleBlock | null {
  const upcoming = blocks
    .filter((b) => b.start > nowMinutes)
    .sort((a, b) => a.start - b.start);
  return upcoming[0] ?? null;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Walks backward day-by-day from today. "weekday" cadence skips Sat/Sun
// without breaking the streak, so trading/homeschool habits don't show a
// broken streak every weekend — the opposite of what a habit tracker
// should do. Today itself is excluded if not yet logged, so an
// in-progress day doesn't zero out an otherwise-intact streak.
export function computeHabitStreak(
  doneDates: Set<string>,
  cadence: "daily" | "weekday",
): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!doneDates.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 3650; i++) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 6;
    if (cadence === "weekday" && isWeekend) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (!doneDates.has(dateKey(cursor))) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

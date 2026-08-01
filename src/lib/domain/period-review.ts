export type PeriodType = "week" | "month" | "quarter" | "year" | "custom";

// Gates every weekly-only Review section (Process Score, Trade Breakdown,
// Opportunity Review, Screenshot Review, Confidence Scores, Decision
// Quality Score) — month/quarter/year/custom/null all render the rolled-up
// template instead.
export function isWeeklyTemplate(periodType: string | null | undefined): boolean {
  return periodType === "week";
}

export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1);
}
function endOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
}
function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}
function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function getPeriodRange(
  type: PeriodType,
  referenceDate: Date,
): { start: Date; end: Date } | null {
  switch (type) {
    case "week":
      return { start: startOfWeek(referenceDate), end: endOfWeek(referenceDate) };
    case "month":
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
    case "quarter":
      return { start: startOfQuarter(referenceDate), end: endOfQuarter(referenceDate) };
    case "year":
      return { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
    case "custom":
      return null;
  }
}

// The most recently *completed* Monday-Sunday week relative to referenceDate.
export function getLastCompletedWeekRange(referenceDate: Date): {
  start: Date;
  end: Date;
} {
  const thisWeekStart = startOfWeek(referenceDate);
  const end = new Date(thisWeekStart);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export interface PeriodReviewTradeInput {
  netPnl: number | null;
  rMultiple: number | null;
}

export interface PeriodStats {
  tradeCount: number;
  winners: number;
  losers: number;
  winRate: number | null;
  netPnl: number;
  netR: number;
}

export function computePeriodStats(
  trades: PeriodReviewTradeInput[],
): PeriodStats {
  const winners = trades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losers = trades.filter((t) => (t.netPnl ?? 0) < 0).length;
  const winRate =
    winners + losers > 0 ? (winners / (winners + losers)) * 100 : null;
  const netPnl = trades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const netR = trades.reduce((s, t) => s + (t.rMultiple ?? 0), 0);

  return { tradeCount: trades.length, winners, losers, winRate, netPnl, netR };
}

export interface TiltmeterResult {
  signalCount: number;
  daysWithTrades: number;
  density: number;
  pct: number;
}

// Visual scale only — 2+ tilt signals per trading day reads as "maxed out".
const TILTMETER_CAP_PER_DAY = 2;

export function computeTiltmeter(
  signalCount: number,
  daysWithTrades: number,
): TiltmeterResult {
  const density = daysWithTrades > 0 ? signalCount / daysWithTrades : 0;
  const pct = Math.min(100, (density / TILTMETER_CAP_PER_DAY) * 100);
  return {
    signalCount,
    daysWithTrades,
    density: Math.round(density * 100) / 100,
    pct,
  };
}

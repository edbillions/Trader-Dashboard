export type EventImportance = "high" | "medium" | "low";

export interface EconomicCalendarEvent {
  time: string;
  event: string;
  prior: string | null;
  estimate: string | null;
  importance: EventImportance;
}

export interface WeekAheadDay {
  date: string;
  bullets: string[];
}

export interface TrumpAppearance {
  time: string;
  description: string;
  marketRelevance: string;
}

function isImportance(value: unknown): value is EventImportance {
  return value === "high" || value === "medium" || value === "low";
}

export function parseEconomicCalendar(raw: string | null): EconomicCalendarEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.event === "string" && typeof e.time === "string")
      .map((e) => ({
        time: e.time,
        event: e.event,
        prior: typeof e.prior === "string" ? e.prior : null,
        estimate: typeof e.estimate === "string" ? e.estimate : null,
        importance: isImportance(e.importance) ? e.importance : "low",
      }));
  } catch {
    return [];
  }
}

export function parseWeekAhead(raw: string | null): WeekAheadDay[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((d) => d && typeof d.date === "string" && Array.isArray(d.bullets))
      .map((d) => ({
        date: d.date,
        bullets: d.bullets.filter((b: unknown) => typeof b === "string"),
      }));
  } catch {
    return [];
  }
}

export function parseTrumpAppearances(raw: string | null): TrumpAppearance[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a) => a && typeof a.time === "string" && typeof a.description === "string")
      .map((a) => ({
        time: a.time,
        description: a.description,
        marketRelevance: typeof a.marketRelevance === "string" ? a.marketRelevance : "",
      }));
  } catch {
    return [];
  }
}

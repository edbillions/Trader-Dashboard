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

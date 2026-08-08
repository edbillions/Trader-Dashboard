"use client";

import { useEffect, useState, useTransition } from "react";
import { clsx } from "clsx";
import { generateMacroBriefingAction } from "@/lib/actions/macro-briefing";
import type {
  EconomicCalendarEvent,
  WeekAheadDay,
  TrumpAppearance,
} from "@/lib/types/macro-briefing";

const COLLAPSED_STORAGE_KEY = "macroBriefingCollapsed";

interface Briefing {
  asOf: string | null;
  macroTone: string;
  economicCalendarToday: EconomicCalendarEvent[];
  weekAhead: WeekAheadDay[];
  trumpAppearancesToday: TrumpAppearance[];
  generatedAt: string;
}

const IMPORTANCE_DOT: Record<EconomicCalendarEvent["importance"], string> = {
  high: "bg-loss",
  medium: "bg-accent",
  low: "bg-muted",
};

const IMPORTANCE_LABEL: Record<EconomicCalendarEvent["importance"], string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

// The AI returns `asOf` as free text (usually an ISO timestamp, but not
// guaranteed) — parse it into a readable date when possible, and fall back
// to showing it as-is rather than hiding unusual output.
function formatAsOf(asOf: string | null): string {
  if (!asOf) return "As of unknown";
  const parsed = new Date(asOf);
  if (Number.isNaN(parsed.getTime())) return asOf;
  return `As of ${parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function MacroBriefingCard({
  initial,
}: {
  initial: Briefing | null;
}) {
  const [briefing, setBriefing] = useState(initial);
  const [isGenerating, startGenerate] = useTransition();
  const [unavailable, setUnavailable] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Read the saved preference after mount so server and first client render
  // match (avoids a hydration mismatch) — collapsing then persists across visits.
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  }

  function handleGenerate() {
    setUnavailable(false);
    startGenerate(async () => {
      const res = await generateMacroBriefingAction();
      if (!res.available) {
        setUnavailable(true);
        return;
      }
      // The server action revalidates /dashboard; a page refresh will
      // reflect the new briefing, but we can't read the freshly-saved row
      // from a client action result, so prompt a reload via location.
      window.location.reload();
    });
  }

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Macro briefing
        </h3>
        <div className="flex items-center gap-3">
          {briefing && (
            <span className="text-xs text-muted">
              {formatAsOf(briefing.asOf)}
              <span className="mx-1.5 text-border">·</span>
              saved{" "}
              {new Date(briefing.generatedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
          >
            {isGenerating
              ? "Fetching..."
              : briefing
                ? "Refresh"
                : "Generate today's briefing"}
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand macro briefing" : "Collapse macro briefing"}
            className="rounded-lg border border-border p-1.5 text-muted hover:bg-surface-raised hover:text-foreground"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className={clsx(
                "h-4 w-4 transition-transform",
                collapsed ? "-rotate-90" : "rotate-0",
              )}
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {!collapsed && unavailable && (
        <p className="text-xs text-muted">
          AI features aren&apos;t available — add your Claude API key in
          Settings.
        </p>
      )}

      {!collapsed && !briefing && !unavailable && (
        <p className="text-sm text-muted">
          Pull overnight macro tone, today&apos;s economic calendar, scheduled
          Trump appearances, and the week ahead via AI web search.
        </p>
      )}

      {!collapsed && briefing && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
              Macro tone
            </p>
            <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
              {briefing.macroTone
                .split("\n\n")
                .filter((p) => p.trim())
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
              Trump watch — today
            </p>
            {briefing.trumpAppearancesToday.length > 0 ? (
              <div className="flex flex-col gap-2">
                {briefing.trumpAppearancesToday.map((appearance, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-accent/30 bg-accent/5 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {appearance.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground">
                      {appearance.description}
                    </p>
                    {appearance.marketRelevance && (
                      <p className="mt-1 text-xs text-muted">
                        {appearance.marketRelevance}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Shown explicitly rather than hiding the section — confirms a
              // dedicated search actually ran that day rather than looking
              // like the section was silently skipped.
              <p className="text-sm text-muted">
                No confirmed Trump appearances found for today.
              </p>
            )}
          </div>

          {briefing.economicCalendarToday.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                Economic calendar — today
              </p>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised text-muted">
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">Event</th>
                      <th className="px-3 py-2 font-medium">Prior</th>
                      <th className="px-3 py-2 font-medium">Est.</th>
                      <th className="px-3 py-2 font-medium">Importance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {briefing.economicCalendarToday.map((event, i) => (
                      <tr
                        key={i}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-3 py-2 text-muted">{event.time}</td>
                        <td className="px-3 py-2 text-foreground">
                          {event.event}
                        </td>
                        <td className="px-3 py-2 text-muted">
                          {event.prior ?? "—"}
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {event.estimate ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={clsx(
                                "h-1.5 w-1.5 rounded-full",
                                IMPORTANCE_DOT[event.importance],
                              )}
                            />
                            {IMPORTANCE_LABEL[event.importance]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {briefing.weekAhead.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                Week ahead
              </p>
              <div className="flex flex-col gap-3">
                {briefing.weekAhead.map((day) => (
                  <div
                    key={day.date}
                    className="rounded-lg border border-border bg-surface-raised p-3"
                  >
                    <p className="mb-1.5 text-xs font-semibold text-foreground">
                      {day.date}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {day.bullets.map((b, i) => (
                        <li key={i} className="text-xs text-muted">
                          • {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

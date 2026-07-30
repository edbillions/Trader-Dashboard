"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { generateMacroBriefingAction } from "@/lib/actions/macro-briefing";
import type {
  EconomicCalendarEvent,
  WeekAheadDay,
} from "@/lib/types/macro-briefing";

interface Briefing {
  asOf: string | null;
  macroTone: string;
  economicCalendarToday: EconomicCalendarEvent[];
  weekAhead: WeekAheadDay[];
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

export function MacroBriefingCard({
  initial,
}: {
  initial: Briefing | null;
}) {
  const [briefing, setBriefing] = useState(initial);
  const [isGenerating, startGenerate] = useTransition();
  const [unavailable, setUnavailable] = useState(false);

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
              {briefing.asOf ?? "Generated"}{" "}
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
        </div>
      </div>

      {unavailable && (
        <p className="text-xs text-muted">
          AI features aren&apos;t available — add your Claude API key in
          Settings.
        </p>
      )}

      {!briefing && !unavailable && (
        <p className="text-sm text-muted">
          Pull overnight macro tone, today&apos;s economic calendar, and the
          week ahead via AI web search.
        </p>
      )}

      {briefing && (
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

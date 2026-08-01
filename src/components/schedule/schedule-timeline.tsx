"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { getActiveScheduleBlock, getNextScheduleBlock } from "@/lib/domain/habits";
import { WEEKEND_RHYTHM, getTodayScheduleBlocks } from "@/lib/schedule-data";

function formatMinutes(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

// Schedule blocks only change on minute boundaries, unlike SessionClocks'
// literal seconds hand — a 60s tick is plenty and avoids wasted re-renders.
export function ScheduleTimeline() {
  const [now, setNow] = useState<Date | null>(null);
  const [tab, setTab] = useState<"weekday" | "weekend" | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const actualWeekday = now?.getDay() ?? null;
  const actualIsWeekend = actualWeekday === 0 || actualWeekday === 6;

  useEffect(() => {
    if (tab === null && actualWeekday !== null) {
      setTab(actualIsWeekend ? "weekend" : "weekday");
    }
  }, [actualWeekday, actualIsWeekend, tab]);

  const activeTab = tab ?? "weekday";
  const isLive = now !== null && (activeTab === "weekend") === actualIsWeekend;
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : -1;

  const weekdayForBlocks = actualWeekday && !actualIsWeekend ? actualWeekday : 1;
  const blocks = activeTab === "weekday" ? getTodayScheduleBlocks(weekdayForBlocks) : null;
  const activeBlock = blocks && isLive ? getActiveScheduleBlock(blocks, nowMinutes) : null;
  const nextBlock = blocks && isLive ? getNextScheduleBlock(blocks, nowMinutes) : null;

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Your daily schedule
        </h2>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => setTab("weekday")}
            className={clsx(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              activeTab === "weekday"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground",
            )}
          >
            Weekday
          </button>
          <button
            type="button"
            onClick={() => setTab("weekend")}
            className={clsx(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              activeTab === "weekend"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground",
            )}
          >
            Weekend
          </button>
        </div>
      </div>

      {activeBlock && (
        <div className="mb-4 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
          <span className="font-semibold text-accent">Right now: </span>
          <span className="text-foreground">{activeBlock.label}</span>
          {nextBlock && (
            <span className="ml-2 text-xs text-muted">
              Next: {nextBlock.label} at {formatMinutes(nextBlock.start)}
            </span>
          )}
        </div>
      )}

      {activeTab === "weekday" && blocks ? (
        <div className="flex flex-col">
          {blocks.map((b) => {
            const isActive =
              activeBlock?.start === b.start && activeBlock?.label === b.label;
            return (
              <div
                key={`${b.start}-${b.label}`}
                className={clsx(
                  "flex gap-3 border-l-2 px-3 py-2",
                  isActive ? "border-accent bg-accent/5" : "border-border",
                )}
              >
                <span
                  className={clsx(
                    "w-24 shrink-0 text-xs tabular-nums",
                    isActive ? "font-semibold text-accent" : "text-muted",
                  )}
                >
                  {formatMinutes(b.start)}
                </span>
                <div>
                  <p
                    className={clsx(
                      "text-sm",
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-foreground",
                    )}
                  >
                    {b.label}
                  </p>
                  {b.note && <p className="text-xs text-muted">{b.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Saturday
            </p>
            <ul className="flex flex-col gap-1">
              {WEEKEND_RHYTHM.saturday.map((item) => (
                <li key={item} className="text-sm text-foreground">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Sunday
            </p>
            <ul className="flex flex-col gap-1">
              {WEEKEND_RHYTHM.sunday.map((item) => (
                <li key={item} className="text-sm text-foreground">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

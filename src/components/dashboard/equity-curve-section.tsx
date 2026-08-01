"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { formatCurrency } from "@/lib/pnl";

type Period = "daily" | "weekly" | "monthly" | "total";

const PERIODS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "total", label: "Total" },
];

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Monday-start week boundary, matching how "this week" reads everywhere
// else a calendar period is implied in this app.
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(d);
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfDay(d: Date) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  return start;
}

// Daily/Weekly/Monthly are period-scoped — cumulative P&L resets to $0 at
// the start of that period, not carried over from all-time history, so the
// badge total matches "how am I doing this week/month" rather than
// all-time net P&L. Total is the existing all-time behavior, unchanged.
function buildSeries(
  trades: { entryTime: string; netPnl: number }[],
  period: Period,
): { date: string; equity: number }[] {
  const now = new Date();
  const cutoff =
    period === "daily"
      ? startOfDay(now)
      : period === "weekly"
        ? startOfWeek(now)
        : period === "monthly"
          ? startOfMonth(now)
          : null;

  const scoped = cutoff
    ? trades.filter((t) => new Date(t.entryTime) >= cutoff)
    : trades;

  if (period === "daily") {
    // Intraday resolution — one point per trade, $0-anchored so a single
    // trade still draws a real line rather than one dot.
    let cumulative = 0;
    return [
      { date: "start", equity: 0 },
      ...scoped.map((t, i) => {
        cumulative += t.netPnl;
        return { date: `t${i}`, equity: Math.round(cumulative * 100) / 100 };
      }),
    ];
  }

  const dailyPnl = new Map<string, number>();
  for (const t of scoped) {
    const key = dateKey(new Date(t.entryTime));
    dailyPnl.set(key, (dailyPnl.get(key) ?? 0) + t.netPnl);
  }
  let cumulative = 0;
  return Array.from(dailyPnl.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => {
      cumulative += pnl;
      return { date, equity: Math.round(cumulative * 100) / 100 };
    });
}

export function EquityCurveSection({
  trades,
}: {
  trades: { entryTime: string; netPnl: number }[];
}) {
  const [period, setPeriod] = useState<Period>("total");

  const series = useMemo(() => buildSeries(trades, period), [trades, period]);
  const total = series[series.length - 1]?.equity ?? 0;

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Equity curve
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Cumulative P&amp;L
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-border bg-surface-raised p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={clsx(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  period === p.key
                    ? "bg-accent text-white"
                    : "text-muted hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span
            className={
              total >= 0
                ? "text-sm font-semibold text-profit"
                : "text-sm font-semibold text-loss"
            }
          >
            {total >= 0 ? "+" : ""}
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {series.length > 1 ? (
        <EquityCurveChart data={series} variant="minimal" />
      ) : (
        <p className="py-8 text-center text-sm text-muted">
          {period === "total"
            ? "Log a few more days to see your equity curve."
            : "No trades in this period yet."}
        </p>
      )}
    </section>
  );
}

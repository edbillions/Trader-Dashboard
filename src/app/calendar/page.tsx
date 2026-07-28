import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getCalendarMonth } from "@/lib/data/calendar";
import { formatCurrency, formatR } from "@/lib/pnl";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

type Metric = "pnl" | "r" | "discipline";

const METRICS: { key: Metric; label: string }[] = [
  { key: "pnl", label: "Net $ P&L" },
  { key: "r", label: "Net R-multiple" },
  { key: "discipline", label: "Discipline score" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function intensityClass(value: number, maxAbs: number) {
  if (maxAbs === 0 || value === 0) return "bg-surface-raised";
  const ratio = Math.min(1, Math.abs(value) / maxAbs);
  const level = ratio > 0.66 ? 3 : ratio > 0.33 ? 2 : 1;
  if (value > 0) {
    return ["", "bg-profit/20", "bg-profit/40", "bg-profit/70"][level];
  }
  return ["", "bg-loss/20", "bg-loss/40", "bg-loss/70"][level];
}

function disciplineClass(value: number) {
  if (value >= 80) return "bg-profit/60";
  if (value >= 60) return "bg-profit/30";
  if (value >= 40) return "bg-loss/30";
  return "bg-loss/60";
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; metric?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth();
  const metric: Metric =
    params.metric === "r" || params.metric === "discipline"
      ? params.metric
      : "pnl";

  const days = await getCalendarMonth(year, month);
  const byDate = new Map(days.map((d) => [d.date, d]));

  const maxAbsPnl = Math.max(1, ...days.map((d) => Math.abs(d.netPnl)));
  const maxAbsR = Math.max(1, ...days.map((d) => Math.abs(d.netR)));

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const monthTotal = days.reduce((s, d) => s + d.netPnl, 0);

  return (
    <div>
      <PageHeader
        title="Calendar"
        description={`${monthLabel} · ${formatCurrency(monthTotal)} net`}
        actions={
          <div className="flex gap-2">
            {METRICS.map((m) => (
              <Link
                key={m.key}
                href={`/calendar?year=${year}&month=${month}&metric=${m.key}`}
                className={clsx(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium",
                  metric === m.key
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                {m.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/calendar?year=${prevMonth.year}&month=${prevMonth.month}&metric=${metric}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          ← Prev
        </Link>
        <Link
          href={`/calendar?metric=${metric}`}
          className="text-sm text-muted hover:text-foreground"
        >
          Today
        </Link>
        <Link
          href={`/calendar?year=${nextMonth.year}&month=${nextMonth.month}&metric=${metric}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          Next →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-xs font-medium text-muted"
          >
            {d}
          </div>
        ))}
        {cells.map((dayNum, i) => {
          if (dayNum == null) return <div key={i} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const entry = byDate.get(dateKey);

          let bgClass = "bg-surface";
          if (entry) {
            if (metric === "pnl") bgClass = intensityClass(entry.netPnl, maxAbsPnl);
            else if (metric === "r") bgClass = intensityClass(entry.netR, maxAbsR);
            else if (entry.disciplineScore != null)
              bgClass = disciplineClass(entry.disciplineScore);
          }

          const content = entry ? (
            <>
              <span className="text-xs font-medium text-muted">{dayNum}</span>
              {metric === "pnl" && (
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(entry.netPnl)}
                </span>
              )}
              {metric === "r" && (
                <span className="text-sm font-semibold text-foreground">
                  {formatR(entry.netR)}
                </span>
              )}
              {metric === "discipline" && (
                <span className="text-sm font-semibold text-foreground">
                  {entry.disciplineScore != null
                    ? Math.round(entry.disciplineScore)
                    : "—"}
                </span>
              )}
              <span className="text-[10px] text-muted">
                {entry.tradeCount} trade{entry.tradeCount === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted">{dayNum}</span>
          );

          const body = (
            <div
              className={clsx(
                "flex h-20 flex-col justify-between rounded-lg border border-border p-2",
                bgClass,
              )}
            >
              {content}
            </div>
          );

          return entry ? (
            <Link key={i} href={`/journal/${dateKey}`}>
              {body}
            </Link>
          ) : (
            <div key={i}>{body}</div>
          );
        })}
      </div>
    </div>
  );
}

import { clsx } from "clsx";
import type { GroupStat } from "@/lib/data/analytics";
import { formatCurrency, formatR } from "@/lib/pnl";

const GRADE_ORDER = ["A+", "A", "B", "C"];

export function SetupGradeCards({ stats }: { stats: GroupStat[] }) {
  const byGrade = new Map(stats.map((s) => [s.label, s]));
  const grades = GRADE_ORDER.filter((g) => byGrade.has(g));

  if (grades.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        Grade your setups (A+/A/B/C) when logging trades to see if your
        grading actually predicts your winners.
      </div>
    );
  }

  const bestWinRate = Math.max(
    ...grades.map((g) => byGrade.get(g)!.winRate ?? -Infinity),
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {grades.map((grade) => {
        const s = byGrade.get(grade)!;
        const isBest = s.winRate === bestWinRate && s.winRate != null;
        return (
          <div
            key={grade}
            className={clsx(
              "rounded-xl border p-4 text-center",
              isBest
                ? "border-accent/50 bg-accent/5 shadow-[0_0_20px_-10px_var(--accent)]"
                : "border-border bg-surface",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {grade} setups
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {s.winRate != null ? `${s.winRate.toFixed(0)}%` : "—"}
            </p>
            <p className="text-[11px] text-muted">win rate</p>
            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-muted">
              <span>{s.count} trades</span>
              <span>{formatR(s.avgR)} avg</span>
            </div>
            <p
              className={clsx(
                "mt-1 text-xs font-medium",
                s.netPnl >= 0 ? "text-profit" : "text-loss",
              )}
            >
              {formatCurrency(s.netPnl)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

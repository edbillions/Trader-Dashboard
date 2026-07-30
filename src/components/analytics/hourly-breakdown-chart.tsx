import type { GroupStat } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/pnl";

export function HourlyBreakdownChart({ stats }: { stats: GroupStat[] }) {
  if (stats.length === 0) {
    return <p className="text-sm text-muted">Not enough data yet.</p>;
  }

  const sorted = [...stats].sort((a, b) => a.label.localeCompare(b.label));
  const maxMagnitude = Math.max(...sorted.map((s) => Math.abs(s.netPnl)), 1);
  const totalMagnitude = sorted.reduce((sum, s) => sum + Math.abs(s.netPnl), 0);

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((s) => {
        const widthPct = (Math.abs(s.netPnl) / maxMagnitude) * 100;
        const sharePct =
          totalMagnitude > 0 ? (Math.abs(s.netPnl) / totalMagnitude) * 100 : 0;
        return (
          <div key={s.label} className="flex items-center gap-3 text-xs">
            <span className="w-12 shrink-0 text-muted">{s.label}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-raised">
              <div
                className={
                  s.netPnl >= 0
                    ? "h-full rounded bg-profit/70"
                    : "h-full rounded bg-loss/70"
                }
                style={{ width: `${Math.max(widthPct, 2)}%` }}
              />
            </div>
            <span
              className={
                s.netPnl >= 0
                  ? "w-20 shrink-0 text-right font-medium text-profit"
                  : "w-20 shrink-0 text-right font-medium text-loss"
              }
            >
              {formatCurrency(s.netPnl)}
            </span>
            <span className="w-12 shrink-0 text-right text-muted">
              {sharePct.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

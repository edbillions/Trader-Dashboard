import { clsx } from "clsx";
import type { GroupStat } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/pnl";

export function ConfluenceLeaderboard({ stats }: { stats: GroupStat[] }) {
  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        Tag confluence factors on your trades to see which ones actually earn
        their keep.
      </div>
    );
  }

  const ranked = [...stats].sort(
    (a, b) => (b.winRate ?? -1) - (a.winRate ?? -1),
  );

  return (
    <div className="flex flex-col gap-2.5">
      {ranked.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-xs text-foreground">
            {s.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
            <div
              className={clsx(
                "h-full rounded-full",
                s.netPnl >= 0 ? "bg-profit" : "bg-loss",
              )}
              style={{ width: `${Math.max(s.winRate ?? 0, 3)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-medium text-foreground">
            {s.winRate != null ? `${s.winRate.toFixed(0)}%` : "—"}
          </span>
          <span
            className={clsx(
              "w-20 shrink-0 text-right text-xs font-medium",
              s.netPnl >= 0 ? "text-profit" : "text-loss",
            )}
          >
            {formatCurrency(s.netPnl)}
          </span>
          <span className="w-16 shrink-0 text-right text-[11px] text-muted">
            {s.count} trades
          </span>
        </div>
      ))}
    </div>
  );
}

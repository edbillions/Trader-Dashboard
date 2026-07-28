import type { GroupStat } from "@/lib/data/analytics";
import { formatCurrency, formatR } from "@/lib/pnl";

export function BreakdownTable({
  title,
  stats,
}: {
  title: string;
  stats: GroupStat[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {stats.length === 0 ? (
        <p className="text-sm text-muted">Not enough data yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-2">Group</th>
              <th className="pb-2">Trades</th>
              <th className="pb-2">Win %</th>
              <th className="pb-2">Net P&L</th>
              <th className="pb-2">Avg R</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.label} className="border-t border-border">
                <td className="py-1.5 text-foreground">{s.label}</td>
                <td className="py-1.5 text-muted">{s.count}</td>
                <td className="py-1.5 text-muted">
                  {s.winRate != null ? `${s.winRate.toFixed(0)}%` : "—"}
                </td>
                <td
                  className={
                    s.netPnl >= 0
                      ? "py-1.5 font-medium text-profit"
                      : "py-1.5 font-medium text-loss"
                  }
                >
                  {formatCurrency(s.netPnl)}
                </td>
                <td className="py-1.5 text-muted">{formatR(s.avgR)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

import type { TrueSystemEdge } from "@/lib/domain/system-edge";
import { formatCurrency } from "@/lib/pnl";

export function TrueSystemEdgeCard({ edge }: { edge: TrueSystemEdge }) {
  if (edge.clean.count === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        No fully clean trades yet (zero mistake tags on a day with zero rule
        violations) — keep logging to see your edge when you follow your
        rules.
      </div>
    );
  }

  return (
    <div>
      {edge.winRateGapPct != null && (
        <p className="mb-4 text-sm text-foreground">
          Your edge is{" "}
          <span
            className={edge.winRateGapPct >= 0 ? "font-semibold text-profit" : "font-semibold text-loss"}
          >
            {edge.winRateGapPct >= 0 ? "+" : ""}
            {edge.winRateGapPct.toFixed(0)}%
          </span>{" "}
          {edge.winRateGapPct >= 0 ? "stronger" : "weaker"} when you follow
          your rules.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Group</th>
              <th className="px-3 py-2">Trades</th>
              <th className="px-3 py-2">Win rate</th>
              <th className="px-3 py-2">Profit factor</th>
              <th className="px-3 py-2">Expectancy</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-3 py-2 font-medium text-foreground">
                Clean trades
              </td>
              <td className="px-3 py-2 text-muted">{edge.clean.count}</td>
              <td className="px-3 py-2 text-muted">
                {edge.clean.winRate != null ? `${edge.clean.winRate.toFixed(0)}%` : "—"}
              </td>
              <td className="px-3 py-2 text-muted">
                {edge.clean.profitFactor != null ? edge.clean.profitFactor.toFixed(2) : "—"}
              </td>
              <td className="px-3 py-2 text-muted">{formatCurrency(edge.clean.expectancy)}</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-3 py-2 font-medium text-foreground">
                All trades (blended)
              </td>
              <td className="px-3 py-2 text-muted">{edge.blended.count}</td>
              <td className="px-3 py-2 text-muted">
                {edge.blended.winRate != null ? `${edge.blended.winRate.toFixed(0)}%` : "—"}
              </td>
              <td className="px-3 py-2 text-muted">
                {edge.blended.profitFactor != null ? edge.blended.profitFactor.toFixed(2) : "—"}
              </td>
              <td className="px-3 py-2 text-muted">{formatCurrency(edge.blended.expectancy)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        &quot;Clean&quot; = zero mistake tags on the trade, on a trading day
        with zero rule violations.
      </p>
    </div>
  );
}

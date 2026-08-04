import { clsx } from "clsx";
import Link from "next/link";
import { formatCurrency, formatR } from "@/lib/pnl";

interface TradeLogRow {
  id: string;
  symbol: string;
  direction: string;
  setupGrade: string | null;
  netPnl: number | null;
  rMultiple: number | null;
}

export function TradeLogTable({ trades }: { trades: TradeLogRow[] }) {
  if (trades.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Symbol</th>
            <th className="px-3 py-2 font-medium">Direction</th>
            <th className="px-3 py-2 font-medium">Grade</th>
            <th className="px-3 py-2 font-medium">R</th>
            <th className="px-3 py-2 font-medium">Net P&amp;L</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {trades.map((t) => (
            <tr key={t.id}>
              <td className="px-3 py-2">
                <Link href={`/trades/${t.id}`} className="text-accent hover:underline">
                  {t.symbol}
                </Link>
              </td>
              <td className="px-3 py-2 uppercase text-muted">{t.direction}</td>
              <td className="px-3 py-2 text-muted">{t.setupGrade ?? "—"}</td>
              <td className="px-3 py-2 text-muted">{formatR(t.rMultiple)}</td>
              <td
                className={clsx(
                  "px-3 py-2 font-medium",
                  (t.netPnl ?? 0) > 0
                    ? "text-profit"
                    : (t.netPnl ?? 0) < 0
                      ? "text-loss"
                      : "text-muted",
                )}
              >
                {formatCurrency(t.netPnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

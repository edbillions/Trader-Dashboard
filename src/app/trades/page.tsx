import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { listTrades } from "@/lib/data/trades";
import { formatCurrency, formatR } from "@/lib/pnl";

export const dynamic = "force-dynamic";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function TradesPage() {
  const trades = await listTrades();

  return (
    <div>
      <PageHeader
        title="Trades"
        description={`${trades.length} logged trade${trades.length === 1 ? "" : "s"}.`}
        actions={
          <Link
            href="/journal/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Log a trade
          </Link>
        }
      />

      {trades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No trades logged yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Dir</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Net P&L</th>
                <th className="px-4 py-3">R</th>
                <th className="px-4 py-3">Account</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-border hover:bg-surface"
                >
                  <td className="px-4 py-3 text-muted">
                    <Link
                      href={`/trades/${t.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {dateKey(t.tradingDay.date)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {t.symbol}
                  </td>
                  <td className="px-4 py-3 text-muted uppercase">
                    {t.direction}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {t.entryModel ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{t.session ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {t.setupGrade ?? "—"}
                  </td>
                  <td
                    className={
                      (t.netPnl ?? 0) >= 0
                        ? "px-4 py-3 font-medium text-profit"
                        : "px-4 py-3 font-medium text-loss"
                    }
                  >
                    {formatCurrency(t.netPnl)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatR(t.rMultiple)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {t.account ? `${t.account.firmName}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

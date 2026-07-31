import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { listTrades } from "@/lib/data/trades";
import { formatCurrency, formatR } from "@/lib/pnl";
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { DailyPnlChart } from "@/components/trades/daily-pnl-chart";
import { WinRatioBar } from "@/components/trades/win-ratio-bar";

export const dynamic = "force-dynamic";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function TradesPage() {
  const trades = await listTrades();

  const netPnl = trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
  const wins = trades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losses = trades.filter((t) => (t.netPnl ?? 0) < 0).length;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;

  const dailyPnlMap = new Map<string, number>();
  for (const t of trades) {
    const key = t.entryTime.toISOString().slice(0, 10);
    dailyPnlMap.set(key, (dailyPnlMap.get(key) ?? 0) + (t.netPnl ?? 0));
  }
  const dailySorted = Array.from(dailyPnlMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  let cumulative = 0;
  const equityCurve = dailySorted.map(([date, pnl]) => {
    cumulative += pnl;
    return { date, equity: Math.round(cumulative * 100) / 100 };
  });
  const dailyPnl = dailySorted.map(([date, pnl]) => ({
    date,
    netPnl: Math.round(pnl * 100) / 100,
  }));
  const profitDays = dailyPnl
    .filter((d) => d.netPnl > 0)
    .reduce((sum, d) => sum + d.netPnl, 0);
  const lossDays = dailyPnl
    .filter((d) => d.netPnl < 0)
    .reduce((sum, d) => sum + d.netPnl, 0);

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

      {trades.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Net cumulative P&L
            </p>
            <p
              className={
                netPnl >= 0
                  ? "mb-1 text-2xl font-bold text-profit"
                  : "mb-1 text-2xl font-bold text-loss"
              }
            >
              {formatCurrency(netPnl)}
            </p>
            <EquityCurveChart data={equityCurve} height={180} />
            <p className="mt-2 text-xs text-muted">
              Total trades: {trades.length}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Win ratio
            </p>
            <WinRatioBar winRate={winRate} winners={wins} losers={losses} />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Net daily P&L
            </p>
            <DailyPnlChart data={dailyPnl} height={180} />
            <p className="mt-2 text-xs text-muted">
              Profit: <span className="font-medium text-profit">{formatCurrency(profitDays)}</span>{" "}
              Loss: <span className="font-medium text-loss">{formatCurrency(lossDays)}</span>
            </p>
          </div>
        </div>
      )}

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

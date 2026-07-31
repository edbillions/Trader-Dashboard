import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import {
  listTrades,
  listAccountsForFilter,
  listTagCategoriesForPicker,
} from "@/lib/data/trades";
import { formatCurrency } from "@/lib/pnl";
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { DailyPnlChart } from "@/components/trades/daily-pnl-chart";
import { WinRatioBar } from "@/components/trades/win-ratio-bar";
import { TradesFilterBar } from "@/components/trades/trades-filter-bar";
import { TradesTable } from "@/components/trades/trades-table";

export const dynamic = "force-dynamic";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountId?: string;
    accountType?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const { accountId, accountType, start, end } = await searchParams;
  const [trades, accounts, tagCategories] = await Promise.all([
    listTrades({ accountId, accountType, start, end }),
    listAccountsForFilter(),
    listTagCategoriesForPicker(),
  ]);

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

      <TradesFilterBar accounts={accounts} />

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
          {accountId || accountType || start || end
            ? "No trades match the current filters."
            : "No trades logged yet."}
        </div>
      ) : (
        <TradesTable trades={trades} tagCategories={tagCategories} />
      )}
    </div>
  );
}

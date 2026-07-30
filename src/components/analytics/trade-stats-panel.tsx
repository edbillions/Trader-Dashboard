import { formatCurrency, formatR } from "@/lib/pnl";
import type { AnalyticsData } from "@/lib/data/analytics";

function formatMinutes(value: number | null): string {
  if (value == null) return "—";
  const total = Math.round(value);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function pnlClass(value: number | null | undefined): string {
  if (value == null) return "text-foreground";
  return value >= 0 ? "text-profit" : "text-loss";
}

function Row({
  label,
  value,
  tone = "none",
}: {
  label: string;
  value: string;
  tone?: "auto" | "profit" | "loss" | "none";
}) {
  const toneClass =
    tone === "profit"
      ? "text-profit"
      : tone === "loss"
        ? "text-loss"
        : "text-foreground";

  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className={`font-medium ${toneClass}`}>{value}</span>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  forceTone,
}: {
  label: string;
  value: number | null;
  forceTone?: "profit" | "loss";
}) {
  const tone = forceTone ?? (value == null ? "none" : value >= 0 ? "profit" : "loss");
  return <Row label={label} value={formatCurrency(value)} tone={tone} />;
}

export function TradeStatsPanel({
  stats,
  monthlyPnl,
}: {
  stats: AnalyticsData["stats"];
  monthlyPnl: AnalyticsData["monthlyPnl"];
}) {
  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Your stats
      </h3>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-surface-raised p-3">
          <p className="text-xs font-medium text-muted">Best month</p>
          <p className={`mt-0.5 text-lg font-semibold ${pnlClass(monthlyPnl.bestMonth?.netPnl)}`}>
            {monthlyPnl.bestMonth ? formatCurrency(monthlyPnl.bestMonth.netPnl) : "—"}
          </p>
          <p className="text-xs text-muted">
            {monthlyPnl.bestMonth ? formatMonthLabel(monthlyPnl.bestMonth.label) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-raised p-3">
          <p className="text-xs font-medium text-muted">Lowest month</p>
          <p className={`mt-0.5 text-lg font-semibold ${pnlClass(monthlyPnl.lowestMonth?.netPnl)}`}>
            {monthlyPnl.lowestMonth ? formatCurrency(monthlyPnl.lowestMonth.netPnl) : "—"}
          </p>
          <p className="text-xs text-muted">
            {monthlyPnl.lowestMonth ? formatMonthLabel(monthlyPnl.lowestMonth.label) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-raised p-3">
          <p className="text-xs font-medium text-muted">Avg per month</p>
          <p className={`mt-0.5 text-lg font-semibold ${pnlClass(monthlyPnl.avgPerMonth)}`}>
            {formatCurrency(monthlyPnl.avgPerMonth)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Trades
          </p>
          <MoneyRow label="Total P&L" value={stats.totalPnl} />
          <MoneyRow label="Avg trade P&L" value={stats.avgTradePnl} />
          <MoneyRow label="Avg win" value={stats.avgWin} forceTone="profit" />
          <MoneyRow label="Avg loss" value={stats.avgLoss} forceTone="loss" />
          <Row label="Profit factor" value={stats.profitFactor != null ? stats.profitFactor.toFixed(2) : "—"} />
          <MoneyRow label="Trade expectancy" value={stats.tradeExpectancy} />
          <Row label="Winning trades" value={stats.winningTradeCount.toString()} />
          <Row label="Losing trades" value={stats.losingTradeCount.toString()} />
          <Row label="Breakeven trades" value={stats.breakevenTradeCount.toString()} />
          <Row label="Open trades" value={stats.openTradesCount.toString()} />
          <Row label="Max consecutive wins" value={stats.maxConsecutiveWins.toString()} />
          <Row label="Max consecutive losses" value={stats.maxConsecutiveLosses.toString()} />
          <MoneyRow label="Largest profit" value={stats.largestProfit} forceTone="profit" />
          <MoneyRow label="Largest loss" value={stats.largestLoss} forceTone="loss" />
          <Row label="Total commissions" value={formatCurrency(stats.totalCommissions)} />
          <Row label="Avg position size / day" value={stats.avgPositionSizePerDay != null ? stats.avgPositionSizePerDay.toFixed(1) : "—"} />
          <Row label="Avg hold time (all)" value={formatMinutes(stats.avgHoldMinutesAll)} />
          <Row label="Avg hold time (winners)" value={formatMinutes(stats.avgHoldMinutesWinning)} />
          <Row label="Avg hold time (losers)" value={formatMinutes(stats.avgHoldMinutesLosing)} />
          <Row label="Avg planned R:R" value={formatR(stats.avgPlannedR)} />
          <Row label="Avg realized R" value={formatR(stats.avgRealizedR)} />
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Days
          </p>
          <Row label="Logged days" value={stats.loggedDays.toString()} />
          <Row label="Trading days" value={stats.totalTradingDays.toString()} />
          <Row label="Winning days" value={stats.winningDays.toString()} />
          <Row label="Losing days" value={stats.losingDays.toString()} />
          <Row label="Breakeven days" value={stats.breakevenDays.toString()} />
          <Row label="Max consecutive winning days" value={stats.maxConsecutiveWinningDays.toString()} />
          <Row label="Max consecutive losing days" value={stats.maxConsecutiveLosingDays.toString()} />
          <MoneyRow label="Avg daily P&L" value={stats.avgDailyPnl} />
          <MoneyRow label="Avg winning day P&L" value={stats.avgWinningDayPnl} forceTone="profit" />
          <MoneyRow label="Avg losing day P&L" value={stats.avgLosingDayPnl} forceTone="loss" />
          <MoneyRow label="Largest profitable day" value={stats.largestProfitableDay} forceTone="profit" />
          <MoneyRow label="Largest losing day" value={stats.largestLosingDay} forceTone="loss" />
        </div>
      </div>
    </section>
  );
}

import {
  AnimatedNumber,
  type AnimatedNumberFormat,
} from "@/components/ui/animated-number";
import type { AnalyticsData } from "@/lib/data/analytics";

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
  value: React.ReactNode;
  tone?: "profit" | "loss" | "none";
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
  return (
    <Row
      label={label}
      value={<AnimatedNumber value={value} format="currency" />}
      tone={tone}
    />
  );
}

function NumRow({
  label,
  value,
  format = "integer",
}: {
  label: string;
  value: number | null;
  format?: AnimatedNumberFormat;
}) {
  return <Row label={label} value={<AnimatedNumber value={value} format={format} />} />;
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
            <AnimatedNumber
              value={monthlyPnl.bestMonth?.netPnl ?? null}
              format="currency"
            />
          </p>
          <p className="text-xs text-muted">
            {monthlyPnl.bestMonth ? formatMonthLabel(monthlyPnl.bestMonth.label) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-raised p-3">
          <p className="text-xs font-medium text-muted">Lowest month</p>
          <p className={`mt-0.5 text-lg font-semibold ${pnlClass(monthlyPnl.lowestMonth?.netPnl)}`}>
            <AnimatedNumber
              value={monthlyPnl.lowestMonth?.netPnl ?? null}
              format="currency"
            />
          </p>
          <p className="text-xs text-muted">
            {monthlyPnl.lowestMonth ? formatMonthLabel(monthlyPnl.lowestMonth.label) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-raised p-3">
          <p className="text-xs font-medium text-muted">Avg per month</p>
          <p className={`mt-0.5 text-lg font-semibold ${pnlClass(monthlyPnl.avgPerMonth)}`}>
            <AnimatedNumber value={monthlyPnl.avgPerMonth} format="currency" />
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
          <NumRow label="Profit factor" value={stats.profitFactor} format="fixed2" />
          <MoneyRow label="Trade expectancy" value={stats.tradeExpectancy} />
          <NumRow label="Winning trades" value={stats.winningTradeCount} />
          <NumRow label="Losing trades" value={stats.losingTradeCount} />
          <NumRow label="Breakeven trades" value={stats.breakevenTradeCount} />
          <NumRow label="Open trades" value={stats.openTradesCount} />
          <NumRow label="Max consecutive wins" value={stats.maxConsecutiveWins} />
          <NumRow label="Max consecutive losses" value={stats.maxConsecutiveLosses} />
          <MoneyRow label="Largest profit" value={stats.largestProfit} forceTone="profit" />
          <MoneyRow label="Largest loss" value={stats.largestLoss} forceTone="loss" />
          <MoneyRow label="Total commissions" value={stats.totalCommissions} />
          <NumRow
            label="Avg position size / day"
            value={stats.avgPositionSizePerDay}
            format="fixed1"
          />
          <NumRow
            label="Avg hold time (all)"
            value={stats.avgHoldMinutesAll}
            format="minutes"
          />
          <NumRow
            label="Avg hold time (winners)"
            value={stats.avgHoldMinutesWinning}
            format="minutes"
          />
          <NumRow
            label="Avg hold time (losers)"
            value={stats.avgHoldMinutesLosing}
            format="minutes"
          />
          <NumRow label="Avg planned R:R" value={stats.avgPlannedR} format="r" />
          <NumRow label="Avg realized R" value={stats.avgRealizedR} format="r" />
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Days
          </p>
          <NumRow label="Logged days" value={stats.loggedDays} />
          <NumRow label="Trading days" value={stats.totalTradingDays} />
          <NumRow label="Winning days" value={stats.winningDays} />
          <NumRow label="Losing days" value={stats.losingDays} />
          <NumRow label="Breakeven days" value={stats.breakevenDays} />
          <NumRow label="Max consecutive winning days" value={stats.maxConsecutiveWinningDays} />
          <NumRow label="Max consecutive losing days" value={stats.maxConsecutiveLosingDays} />
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

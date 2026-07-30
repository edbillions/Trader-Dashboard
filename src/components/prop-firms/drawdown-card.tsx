import { clsx } from "clsx";
import { formatCurrency } from "@/lib/pnl";
import { Gauge } from "@/components/ui/gauge";

interface Drawdown {
  currentEquity: number;
  peakEquity: number;
  currentDrawdown: number;
}

export function DrawdownCard({
  startingBalance,
  maxDrawdownLimit,
  dailyLossLimit,
  drawdown,
  todayLoss,
}: {
  startingBalance: number | null;
  maxDrawdownLimit: number | null;
  dailyLossLimit: number | null;
  drawdown: Drawdown | null;
  todayLoss: number;
}) {
  if (startingBalance == null) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
        Add a starting balance and drawdown limits above to unlock live
        drawdown tracking for this account.
      </div>
    );
  }

  const ddPct =
    maxDrawdownLimit != null && maxDrawdownLimit > 0 && drawdown
      ? (drawdown.currentDrawdown / maxDrawdownLimit) * 100
      : null;
  const dailyPct =
    dailyLossLimit != null && dailyLossLimit > 0
      ? (todayLoss / dailyLossLimit) * 100
      : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Drawdown tracker
      </h3>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs font-medium text-muted">Current equity</p>
          <p className="mt-0.5 text-lg font-semibold text-foreground">
            {formatCurrency(drawdown?.currentEquity ?? startingBalance)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Peak equity</p>
          <p className="mt-0.5 text-lg font-semibold text-foreground">
            {formatCurrency(drawdown?.peakEquity ?? startingBalance)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Current drawdown</p>
          <p
            className={clsx(
              "mt-0.5 text-lg font-semibold",
              (drawdown?.currentDrawdown ?? 0) > 0
                ? "text-loss"
                : "text-foreground",
            )}
          >
            {formatCurrency(drawdown?.currentDrawdown ?? 0)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {ddPct != null && (
          <Gauge
            label="Max drawdown used"
            usedLabel={formatCurrency(drawdown?.currentDrawdown ?? 0)}
            limitLabel={formatCurrency(maxDrawdownLimit)}
            pct={ddPct}
          />
        )}
        {dailyPct != null && (
          <Gauge
            label="Today's loss vs. daily limit"
            usedLabel={formatCurrency(todayLoss)}
            limitLabel={formatCurrency(dailyLossLimit)}
            pct={dailyPct}
          />
        )}
      </div>

      <p className="mt-4 text-[11px] text-muted">
        Based on trading P&L only — fees and payouts aren&apos;t counted
        toward drawdown.
      </p>
    </div>
  );
}

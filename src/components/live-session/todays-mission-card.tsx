import { formatCurrency } from "@/lib/pnl";
import { Gauge } from "@/components/ui/gauge";

export function TodaysMissionCard({
  missionLabel,
  maxLossPlan,
  lossUsedToday,
  lossPct,
  maxTradeCountPlan,
  tradesTaken,
  tradeCountPct,
  profitLockPlan,
  netPnlToday,
}: {
  missionLabel: string | null;
  maxLossPlan: number | null;
  lossUsedToday: number;
  lossPct: number | null;
  maxTradeCountPlan: number | null;
  tradesTaken: number;
  tradeCountPct: number | null;
  profitLockPlan: number | null;
  netPnlToday: number;
}) {
  const hasPlan = maxLossPlan != null || maxTradeCountPlan != null || profitLockPlan != null;

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Today&apos;s Mission</h3>
      <p className="mb-3 text-sm text-muted">
        {missionLabel?.trim() || "Trade the Plan — wait for the A+ setup."}
      </p>

      {!hasPlan && (
        <p className="text-xs text-muted">
          No risk plan set for today — fill out the Pre-Market Plan to set max
          trades / max loss / profit lock.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {maxLossPlan != null && (
          <Gauge
            label="Max daily loss"
            usedLabel={formatCurrency(lossUsedToday)}
            limitLabel={formatCurrency(Math.abs(maxLossPlan))}
            pct={lossPct}
            danger={lossPct != null && lossPct >= 100}
          />
        )}
        {maxTradeCountPlan != null && (
          <Gauge
            label="Max trades"
            usedLabel={`${tradesTaken}`}
            limitLabel={`${maxTradeCountPlan}`}
            pct={tradeCountPct}
            danger={tradeCountPct != null && tradeCountPct >= 100}
          />
        )}
        {profitLockPlan != null && (
          <Gauge
            label="Profit lock"
            usedLabel={formatCurrency(netPnlToday)}
            limitLabel={formatCurrency(profitLockPlan)}
            pct={profitLockPlan > 0 ? (netPnlToday / profitLockPlan) * 100 : null}
            danger={false}
          />
        )}
      </div>
    </section>
  );
}

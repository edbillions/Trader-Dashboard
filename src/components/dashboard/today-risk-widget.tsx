import { formatCurrency } from "@/lib/pnl";
import { Gauge } from "@/components/ui/gauge";

interface TodayRisk {
  maxLossPlan: number | null;
  lossUsed: number;
  maxTradeCountPlan: number | null;
  tradesTaken: number;
}

export function TodayRiskWidget({ risk }: { risk: TodayRisk | null }) {
  if (!risk) return null;

  const { maxLossPlan, lossUsed, maxTradeCountPlan, tradesTaken } = risk;

  if (maxLossPlan == null && maxTradeCountPlan == null) {
    return null;
  }

  const lossPct =
    maxLossPlan != null && maxLossPlan > 0
      ? (lossUsed / maxLossPlan) * 100
      : null;
  const tradeCountPct =
    maxTradeCountPlan != null && maxTradeCountPlan > 0
      ? (tradesTaken / maxTradeCountPlan) * 100
      : null;

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Today&apos;s risk budget
      </h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {maxLossPlan != null && (
          <Gauge
            label="Loss budget used"
            usedLabel={formatCurrency(lossUsed)}
            limitLabel={formatCurrency(maxLossPlan)}
            pct={lossPct}
            danger={lossPct != null && lossPct >= 100}
          />
        )}
        {maxTradeCountPlan != null && (
          <Gauge
            label="Trades taken"
            usedLabel={`${tradesTaken}`}
            limitLabel={`${maxTradeCountPlan}`}
            pct={tradeCountPct}
            danger={tradeCountPct != null && tradeCountPct >= 100}
          />
        )}
      </div>
    </section>
  );
}

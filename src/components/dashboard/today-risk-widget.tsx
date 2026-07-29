import { clsx } from "clsx";
import { formatCurrency } from "@/lib/pnl";

interface TodayRisk {
  maxLossPlan: number | null;
  lossUsed: number;
  maxTradeCountPlan: number | null;
  tradesTaken: number;
}

function Gauge({
  label,
  usedLabel,
  limitLabel,
  pct,
  danger,
}: {
  label: string;
  usedLabel: string;
  limitLabel: string;
  pct: number | null;
  danger: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-xs text-muted">
          {usedLabel}{" "}
          <span className="text-foreground/70">of {limitLabel}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            pct == null
              ? "bg-border"
              : danger
                ? "bg-loss"
                : pct >= 75
                  ? "bg-accent"
                  : "bg-profit",
          )}
          style={{ width: `${pct != null ? Math.min(pct, 100) : 0}%` }}
        />
      </div>
    </div>
  );
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

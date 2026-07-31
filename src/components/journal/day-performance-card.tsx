import { clsx } from "clsx";
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { formatCurrency } from "@/lib/pnl";

interface DayTradeLike {
  netPnl: number | null;
  grossPnl: number | null;
  commission: number | null;
  positionSize: number;
  entryTime: Date;
}

export function DayPerformanceCard({ trades }: { trades: DayTradeLike[] }) {
  if (trades.length === 0) return null;

  const winners = trades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losers = trades.filter((t) => (t.netPnl ?? 0) < 0).length;
  const grossPnl = trades.reduce((sum, t) => sum + (t.grossPnl ?? 0), 0);
  const commissions = trades.reduce((sum, t) => sum + (t.commission ?? 0), 0);
  const volume = trades.reduce((sum, t) => sum + t.positionSize, 0);
  const winRate =
    winners + losers > 0 ? (winners / (winners + losers)) * 100 : null;

  const grossProfit = trades
    .filter((t) => (t.netPnl ?? 0) > 0)
    .reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
  const grossLoss = Math.abs(
    trades
      .filter((t) => (t.netPnl ?? 0) < 0)
      .reduce((sum, t) => sum + (t.netPnl ?? 0), 0),
  );
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;

  let cumulative = 0;
  const series = trades.map((t) => {
    cumulative += t.netPnl ?? 0;
    return {
      date: t.entryTime.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
      equity: Math.round(cumulative * 100) / 100,
    };
  });

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-4 md:grid-cols-2">
      <EquityCurveChart data={series} height={160} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total trades" value={trades.length.toString()} />
        <Stat label="Winners" value={winners.toString()} tone="profit" />
        <Stat
          label="Gross P&L"
          value={formatCurrency(grossPnl)}
          tone={grossPnl >= 0 ? "profit" : "loss"}
        />
        <Stat label="Commissions" value={formatCurrency(commissions)} />
        <Stat
          label="Winrate"
          value={winRate != null ? `${winRate.toFixed(2)}%` : "—"}
        />
        <Stat label="Losers" value={losers.toString()} tone="loss" />
        <Stat label="Volume" value={volume.toString()} />
        <Stat
          label="Profit factor"
          value={profitFactor != null ? profitFactor.toFixed(2) : "—"}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={clsx(
          "mt-0.5 text-lg font-semibold",
          tone === "profit"
            ? "text-profit"
            : tone === "loss"
              ? "text-loss"
              : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

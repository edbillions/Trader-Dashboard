import { formatCurrency } from "@/lib/pnl";

export function StatsRow({
  netPnlToday,
  disciplineScore100,
  tradesTaken,
  winRate,
}: {
  netPnlToday: number;
  disciplineScore100: number;
  tradesTaken: number;
  winRate: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat
        label="P&L today"
        value={formatCurrency(netPnlToday)}
        positive={netPnlToday >= 0}
      />
      <Stat label="Discipline score" value={`${disciplineScore100}/100`} />
      <Stat label="Trades" value={`${tradesTaken}`} />
      <Stat label="Win rate" value={winRate != null ? `${winRate.toFixed(0)}%` : "—"} />
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tracking-tight ${
          positive === undefined ? "text-foreground" : positive ? "text-profit" : "text-loss"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

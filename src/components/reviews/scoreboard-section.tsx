import { Stat } from "@/components/reviews/stat";
import { formatCurrency, formatR } from "@/lib/pnl";

export function ScoreboardSection({
  tradeCount,
  netR,
  winRate,
  profitFactor,
  tradeExpectancy,
  avgWin,
  avgLoss,
  largestProfit,
  largestLoss,
  aPlusSetupsPassed,
  ruleViolationCount,
}: {
  tradeCount: number;
  netR: number;
  winRate: number | null;
  profitFactor: number | null;
  tradeExpectancy: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  largestProfit: number | null;
  largestLoss: number | null;
  aPlusSetupsPassed: number;
  ruleViolationCount: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Scoreboard</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Net R" value={formatR(netR)} positive={netR >= 0} />
        <Stat label="Win rate" value={winRate != null ? `${winRate.toFixed(0)}%` : "—"} />
        <Stat
          label="Profit factor"
          value={profitFactor != null ? profitFactor.toFixed(2) : "—"}
        />
        <Stat
          label="Expectancy"
          value={tradeExpectancy != null ? formatCurrency(tradeExpectancy) : "—"}
        />
        <Stat label="Avg winner" value={avgWin != null ? formatCurrency(avgWin) : "—"} />
        <Stat label="Avg loser" value={avgLoss != null ? formatCurrency(avgLoss) : "—"} />
        <Stat
          label="Largest win"
          value={largestProfit != null ? formatCurrency(largestProfit) : "—"}
        />
        <Stat
          label="Largest loss"
          value={largestLoss != null ? formatCurrency(largestLoss) : "—"}
        />
        <Stat label="Trades taken" value={`${tradeCount}`} />
        <Stat label="A+ setups passed" value={`${aPlusSetupsPassed}`} />
        <Stat
          label="Rule violations"
          value={`${ruleViolationCount}`}
          positive={ruleViolationCount === 0}
        />
      </div>
    </div>
  );
}

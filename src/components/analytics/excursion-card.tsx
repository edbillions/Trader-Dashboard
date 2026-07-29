import { formatR } from "@/lib/pnl";

interface Excursion {
  sampleSize: number;
  avgMfeR: number | null;
  avgMaeR: number | null;
  avgRealizedR: number | null;
  captureRate: number | null;
}

export function ExcursionCard({ excursion }: { excursion: Excursion }) {
  if (excursion.sampleSize === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        Log max favorable/adverse excursion (in R) on your trades to see if
        you&apos;re cutting winners short or letting losers run.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-medium text-muted">Avg R realized</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatR(excursion.avgRealizedR)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Avg max favorable</p>
          <p className="mt-1 text-xl font-semibold text-profit">
            {formatR(excursion.avgMfeR)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Avg max adverse</p>
          <p className="mt-1 text-xl font-semibold text-loss">
            {excursion.avgMaeR != null ? `${excursion.avgMaeR.toFixed(2)}R` : "—"}
          </p>
        </div>
      </div>

      {excursion.captureRate != null && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-medium text-muted">
              R captured of what was available
            </span>
            <span className="text-xs font-medium text-foreground">
              {excursion.captureRate.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-accent"
              style={{
                width: `${Math.min(Math.max(excursion.captureRate, 0), 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {excursion.captureRate < 60
              ? "You're leaving a lot on the table — consider trailing stops or scaling out later."
              : "You're capturing most of the move you're catching — solid exit discipline."}
          </p>
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted">
        Based on {excursion.sampleSize} trade
        {excursion.sampleSize === 1 ? "" : "s"} with excursion data logged.
      </p>
    </div>
  );
}

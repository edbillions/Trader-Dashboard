import { clsx } from "clsx";
import { formatCurrency } from "@/lib/pnl";

interface TimelineTrade {
  id: string;
  symbol: string;
  direction: string;
  netPnl: number | null;
  entryTime: Date;
  quickLogged: boolean;
}

export function SessionTimeline({
  trades,
  sessionEndedAt,
}: {
  trades: TimelineTrade[];
  sessionEndedAt: Date | null;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Session Timeline</h3>
      {trades.length === 0 ? (
        <p className="text-sm text-muted">No trades logged today.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {trades.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-raised px-3 py-2 text-sm"
            >
              <span className="text-muted">
                {t.entryTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-foreground">
                {t.symbol} · {t.direction.toUpperCase()}
                {t.quickLogged && (
                  <span className="ml-1.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    Quick logged
                  </span>
                )}
              </span>
              <span
                className={clsx(
                  "font-semibold",
                  (t.netPnl ?? 0) > 0
                    ? "text-profit"
                    : (t.netPnl ?? 0) < 0
                      ? "text-loss"
                      : "text-muted",
                )}
              >
                {formatCurrency(t.netPnl)}
              </span>
            </li>
          ))}
          {sessionEndedAt && (
            <li className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm">
              <span className="text-muted">
                {sessionEndedAt.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span className="font-medium text-accent">Session ended voluntarily</span>
              <span />
            </li>
          )}
        </ol>
      )}
    </section>
  );
}

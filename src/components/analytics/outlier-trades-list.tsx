import Link from "next/link";
import { formatCurrency, formatR } from "@/lib/pnl";

interface OutlierTrade {
  id: string;
  symbol: string;
  date: string;
  netPnl: number | null;
  rMultiple: number | null;
}

export function OutlierTradesList({
  title,
  trades,
  tone,
}: {
  title: string;
  trades: OutlierTrade[];
  tone: "profit" | "loss";
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {trades.length === 0 ? (
        <p className="text-sm text-muted">Not enough data yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {trades.map((t) => (
            <Link
              key={t.id}
              href={`/trades/${t.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm hover:bg-surface"
            >
              <span className="text-foreground">
                {t.symbol} <span className="text-xs text-muted">{t.date}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-muted">{formatR(t.rMultiple)}</span>
                <span
                  className={`font-medium ${tone === "profit" ? "text-profit" : "text-loss"}`}
                >
                  {formatCurrency(t.netPnl)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

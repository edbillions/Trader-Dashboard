import type { FullTrade } from "@/lib/data/reviews";
import type { TradeBreakdown } from "@/lib/types/review-sections";
import { TextArea, TextInput } from "@/components/ui/field";
import { formatCurrency, formatR } from "@/lib/pnl";

function formatTime(d: Date) {
  return d.toISOString().slice(11, 16);
}

export function TradeBreakdownSection({
  trades,
  breakdown,
}: {
  trades: FullTrade[];
  breakdown: TradeBreakdown;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Trade Breakdown</h2>
      {trades.length === 0 ? (
        <p className="text-xs text-muted">No trades in this period.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {trades.map((t) => {
            const entry = breakdown[t.id] ?? {
              whatWentWell: null,
              improvements: null,
              executionScore: null,
              confidenceScore: null,
            };
            return (
              <div
                key={t.id}
                className="rounded-lg border border-border bg-surface-raised p-3"
              >
                <input type="hidden" name="tradeIds" value={t.id} />
                <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="font-medium text-foreground">{t.symbol}</span>
                  <span>{t.direction}</span>
                  <span>{t.rMultiple != null ? formatR(t.rMultiple) : "—"}</span>
                  <span>{t.setupGrade ?? "—"}</span>
                  <span>{t.dailyBias ?? "—"}</span>
                  <span>{t.entryModel ?? "—"}</span>
                  <span>{formatTime(t.entryTime)}</span>
                  <span>
                    {t.entryPrice} → {t.exitPrice ?? "—"}
                  </span>
                  <span
                    className={
                      t.netPnl != null && t.netPnl >= 0 ? "text-profit" : "text-loss"
                    }
                  >
                    {formatCurrency(t.netPnl)}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextArea
                    name={`tradeBreakdown.${t.id}.whatWentWell`}
                    defaultValue={entry.whatWentWell ?? ""}
                    placeholder="What went well"
                  />
                  <TextArea
                    name={`tradeBreakdown.${t.id}.improvements`}
                    defaultValue={entry.improvements ?? ""}
                    placeholder="Improvements"
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:w-64">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted">Execution (1-10)</span>
                    <TextInput
                      type="number"
                      min={1}
                      max={10}
                      name={`tradeBreakdown.${t.id}.executionScore`}
                      defaultValue={entry.executionScore ?? ""}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted">Confidence (1-10)</span>
                    <TextInput
                      type="number"
                      min={1}
                      max={10}
                      name={`tradeBreakdown.${t.id}.confidenceScore`}
                      defaultValue={entry.confidenceScore ?? ""}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { clsx } from "clsx";
import type { TradeScenario } from "@/lib/ai/premarket-analysis";

const LABEL_CLASS: Record<TradeScenario["label"], string> = {
  Bullish: "text-profit border-profit/30 bg-profit-muted",
  Bearish: "text-loss border-loss/30 bg-loss-muted",
  Range: "text-muted border-border bg-surface-raised",
};

export function TradeScenarioCard({ scenario }: { scenario: TradeScenario }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <span
        className={clsx(
          "mb-3 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold",
          LABEL_CLASS[scenario.label],
        )}
      >
        Scenario {scenario.scenario} — {scenario.label}
      </span>
      <dl className="flex flex-col gap-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted">What price must do</dt>
          <dd className="mt-0.5 text-foreground">{scenario.whatPriceMustDo}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">What to wait for</dt>
          <dd className="mt-0.5 text-foreground">{scenario.whatToWaitFor}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">What confirms entry</dt>
          <dd className="mt-0.5 text-foreground">{scenario.whatConfirmsEntry}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Where risk is invalid</dt>
          <dd className="mt-0.5 text-foreground">{scenario.whereRiskInvalid}</dd>
        </div>
      </dl>
    </div>
  );
}

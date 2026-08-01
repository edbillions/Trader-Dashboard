"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { generateDecisionIntelligenceAction } from "@/lib/actions/coach";
import type {
  DecisionIntelligenceResult,
  FrequencyVerdict,
} from "@/lib/ai/decision-intelligence";

const QUESTIONS: {
  key: keyof Pick<
    DecisionIntelligenceResult,
    "whyWinnersBigger" | "whatChanged" | "worstHabit" | "expectancyImprovement"
  >;
  label: string;
}[] = [
  { key: "whyWinnersBigger", label: "Why are my winners getting bigger?" },
  { key: "whatChanged", label: "What changed over the last 30 trades?" },
  { key: "worstHabit", label: "Which single habit is costing me the most money?" },
  {
    key: "expectancyImprovement",
    label: "If I removed one recurring mistake, how much would my expectancy improve?",
  },
];

const VERDICT_LABEL: Record<FrequencyVerdict, string> = {
  trade_less: "Trade less",
  trade_more: "Trade more",
  keep_same: "Keep everything the same",
  insufficient_data: "Not enough data yet",
};

const VERDICT_CLASSES: Record<FrequencyVerdict, string> = {
  trade_less: "border-loss/40 bg-loss-muted text-loss",
  trade_more: "border-profit/40 bg-profit-muted text-profit",
  keep_same: "border-accent/40 bg-accent/10 text-accent",
  insufficient_data: "border-border bg-surface-raised text-muted",
};

export function DecisionIntelligence() {
  const [isGenerating, startGenerate] = useTransition();
  const [result, setResult] = useState<DecisionIntelligenceResult | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  function handleGenerate() {
    setUnavailable(false);
    startGenerate(async () => {
      const res = await generateDecisionIntelligenceAction();
      if (!res.available || !res.result) {
        setUnavailable(true);
        setResult(null);
        return;
      }
      setResult(res.result);
    });
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Decision Intelligence Engine
        </h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
        >
          {isGenerating ? "Analyzing..." : result ? "Re-analyze" : "Get insights"}
        </button>
      </div>

      {unavailable && (
        <p className="text-xs text-muted">
          AI features aren&apos;t available — add your Claude API key in
          Settings.
        </p>
      )}

      {!result && !unavailable && (
        <p className="text-sm text-muted">
          Answers to the questions that actually change what you do next —
          why your winners are moving, what shifted recently, which habit is
          costing you money, and whether you should be trading more or less
          — grounded in your actual numbers.
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
            {QUESTIONS.map((q) => (
              <div key={q.key}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  {q.label}
                </p>
                <p className="text-sm text-foreground">{result[q.key]}</p>
              </div>
            ))}
          </div>

          <div
            className={clsx(
              "rounded-xl border p-5",
              VERDICT_CLASSES[result.frequency.verdict],
            )}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
              Should I trade less, trade more, or keep everything the same?
            </p>
            <p className="mb-2 text-base font-semibold">
              {VERDICT_LABEL[result.frequency.verdict]}
            </p>
            <p className="text-sm opacity-90">{result.frequency.explanation}</p>
          </div>
        </div>
      )}
    </section>
  );
}

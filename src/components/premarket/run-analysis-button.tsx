"use client";

import { useState, useTransition } from "react";
import { runPreMarketAnalysisAction } from "@/lib/actions/premarket";

export function RunPreMarketAnalysisButton() {
  const [isRunning, startRun] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRun() {
    setError(null);
    startRun(async () => {
      try {
        const res = await runPreMarketAnalysisAction();
        if (!res.ok) {
          setError(
            `Analysis failed for ${res.failed.join(", ")} — check your TradingView ` +
              "login (npm run tradingview:login), saved layouts in Settings, and your " +
              "Claude API key, then try again.",
          );
          return;
        }
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed unexpectedly.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRun}
        disabled={isRunning}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isRunning ? "Running... capturing charts and analyzing, 1-3 min" : "Run Pre-Market Analysis"}
      </button>
      {error && <p className="mt-2 text-xs text-loss">{error}</p>}
    </div>
  );
}

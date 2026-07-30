"use client";

import { useState, useTransition } from "react";
import { runDailyReviewAction } from "@/lib/actions/premarket";

export function RunDailyReviewButton() {
  const [isRunning, startRun] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRun() {
    setError(null);
    startRun(async () => {
      try {
        const res = await runDailyReviewAction();
        if (!res.ok) {
          setError(
            `Review grading failed for ${res.failed.join(", ")} — check your ` +
              "TradingView login and Claude API key, then try again.",
          );
          return;
        }
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Review failed unexpectedly.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRun}
        disabled={isRunning}
        className="rounded-lg border border-accent/40 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
      >
        {isRunning ? "Grading..." : "Run Daily Review"}
      </button>
      {error && <p className="mt-2 text-xs text-loss">{error}</p>}
    </div>
  );
}

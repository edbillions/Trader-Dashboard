"use client";

import { useState, useTransition } from "react";
import { generateJournalAiSummaryAction } from "@/lib/actions/journal";

export function AiSummaryPanel({
  date,
  aiSummary,
}: {
  date: string;
  aiSummary: string | null;
}) {
  const [isGenerating, startGenerate] = useTransition();
  const [unavailable, setUnavailable] = useState(false);

  function handleGenerate() {
    setUnavailable(false);
    startGenerate(async () => {
      const res = await generateJournalAiSummaryAction(date);
      if (!res.available) {
        setUnavailable(true);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          AI summary
        </p>
        {!aiSummary && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        )}
      </div>

      {unavailable && (
        <p className="mt-2 text-xs text-muted">
          AI features aren&apos;t available — add your Claude API key in
          Settings.
        </p>
      )}

      {aiSummary ? (
        <p className="mt-1 text-sm text-foreground">{aiSummary}</p>
      ) : (
        !unavailable && (
          <p className="mt-1 text-sm text-muted">
            No AI summary yet for this day.
          </p>
        )
      )}
    </div>
  );
}

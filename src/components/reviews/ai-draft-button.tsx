"use client";

import { useState, useTransition } from "react";
import { generateReviewAiDraftAction } from "@/lib/actions/reviews";

export function AiDraftButton({ reviewId }: { reviewId: string }) {
  const [isGenerating, startGenerate] = useTransition();
  const [unavailable, setUnavailable] = useState(false);

  function handleGenerate() {
    setUnavailable(false);
    startGenerate(async () => {
      const res = await generateReviewAiDraftAction(reviewId);
      if (!res.available) {
        setUnavailable(true);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
      >
        {isGenerating ? "Generating..." : "Generate AI draft"}
      </button>
      {unavailable && (
        <p className="mt-2 text-xs text-muted">
          AI features aren&apos;t available, or there are no trades in this
          period yet.
        </p>
      )}
    </div>
  );
}

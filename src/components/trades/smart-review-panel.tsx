"use client";

import { useState, useTransition } from "react";
import type { TradeSmartReview } from "@/lib/ai/trade-smart-review";
import { generateTradeSmartReviewAction } from "@/lib/actions/journal";

function parseSmartReview(raw: string | null): TradeSmartReview | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TradeSmartReview>;
    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.setup !== "string" ||
      typeof parsed.execution !== "string" ||
      typeof parsed.psychology !== "string"
    ) {
      return null;
    }
    return parsed as TradeSmartReview;
  } catch {
    return null;
  }
}

const CARDS: { key: keyof TradeSmartReview; title: string }[] = [
  { key: "summary", title: "Trade Summary" },
  { key: "setup", title: "Setup" },
  { key: "execution", title: "Execution" },
  { key: "psychology", title: "Psychology" },
];

export function SmartReviewPanel({
  trade,
}: {
  trade: { id: string; smartReview: string | null };
}) {
  const review = parseSmartReview(trade.smartReview);
  const [isGenerating, startGenerate] = useTransition();
  const [unavailable, setUnavailable] = useState(false);

  function handleGenerate() {
    setUnavailable(false);
    startGenerate(async () => {
      const res = await generateTradeSmartReviewAction(trade.id);
      if (!res.available) {
        setUnavailable(true);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Smart Review</h2>
        {!review && (
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
        <p className="mb-3 text-xs text-muted">
          AI features aren&apos;t available — add your Claude API key in
          Settings.
        </p>
      )}

      {review ? (
        <div className="flex flex-col gap-4">
          {CARDS.map((card) => (
            <div key={card.key}>
              <h3 className="mb-1 text-xs font-medium text-muted">
                {card.title}
              </h3>
              <p className="text-sm text-foreground">{review[card.key]}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          No Smart Review yet for this trade.
        </p>
      )}
    </div>
  );
}

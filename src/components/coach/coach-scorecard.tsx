"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { generateCoachScorecardAction } from "@/lib/actions/coach";
import type { ScorecardCategory } from "@/lib/ai/coach-scorecard";

const TONE_CLASSES: Record<ScorecardCategory["tone"], { bar: string; text: string }> = {
  strong: { bar: "bg-profit", text: "text-profit" },
  neutral: { bar: "bg-accent", text: "text-accent" },
  weak: { bar: "bg-loss", text: "text-loss" },
};

const TONE_WIDTH: Record<ScorecardCategory["tone"], string> = {
  strong: "100%",
  neutral: "66%",
  weak: "33%",
};

export function CoachScorecard() {
  const [isGenerating, startGenerate] = useTransition();
  const [categories, setCategories] = useState<ScorecardCategory[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  function handleGenerate() {
    setUnavailable(false);
    startGenerate(async () => {
      const res = await generateCoachScorecardAction();
      if (!res.available) {
        setUnavailable(true);
        setCategories(null);
        return;
      }
      setCategories(res.categories);
    });
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          AI Coach Scorecard
        </h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
        >
          {isGenerating ? "Scoring..." : categories ? "Re-score" : "Get scorecard"}
        </button>
      </div>

      {unavailable && (
        <p className="text-xs text-muted">
          AI features aren&apos;t available — add your Claude API key in
          Settings.
        </p>
      )}

      {!categories && !unavailable && (
        <p className="text-sm text-muted">
          Get a 5-category AI assessment of your profitability, true system
          edge, trade management, risk management, and process — grounded in
          your actual numbers.
        </p>
      )}

      {categories && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {categories.map((c) => {
            const tone = TONE_CLASSES[c.tone];
            return (
              <div
                key={c.category}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {c.category}
                </h3>
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className={clsx("h-full rounded-full", tone.bar)}
                    style={{ width: TONE_WIDTH[c.tone] }}
                  />
                </div>
                <p className={clsx("mb-1 text-xs font-medium capitalize", tone.text)}>
                  {c.tone}
                </p>
                <p className="text-xs text-muted">{c.assessment}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { getMistakeCoachingAction } from "@/lib/actions/ai";

export function MistakeCoach() {
  const [isLoading, startLoading] = useTransition();
  const [coaching, setCoaching] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  function handleClick() {
    setUnavailable(false);
    startLoading(async () => {
      const result = await getMistakeCoachingAction();
      if (!result.available) {
        setUnavailable(true);
        return;
      }
      setCoaching(result.coaching);
    });
  }

  return (
    <section className="mb-8 rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          AI performance coach — how to improve
        </h3>
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
        >
          {isLoading ? "Analyzing..." : coaching ? "Refresh" : "Get coaching"}
        </button>
      </div>
      {unavailable && (
        <p className="mt-2 text-xs text-muted">
          AI features aren&apos;t available — add your Claude API key in
          Settings.
        </p>
      )}
      {coaching && (
        <p className="mt-2 whitespace-pre-line text-sm text-foreground">
          {coaching}
        </p>
      )}
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { pullIntoJournalPlanAction } from "@/lib/actions/premarket";

export function PullIntoJournalButton({ analysisId }: { analysisId: string }) {
  const [isPending, startTransition] = useTransition();
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await pullIntoJournalPlanAction(analysisId);
        setDateKey(res.dateKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to pull into Journal.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-raised disabled:opacity-60"
      >
        {isPending ? "Pulling in..." : "Pull into today's Pre-Market Plan"}
      </button>
      {dateKey && (
        <span className="text-xs text-profit">
          Pulled in ·{" "}
          <Link href={`/journal/${dateKey}`} className="underline hover:text-accent">
            View in Journal →
          </Link>
        </span>
      )}
      {error && <span className="text-xs text-loss">{error}</span>}
    </div>
  );
}

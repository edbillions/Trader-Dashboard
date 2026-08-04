"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveDebriefAction } from "@/lib/actions/live-session";

export function DebriefForm({
  dateKey,
  initialImprovement,
  initialFeeling,
}: {
  dateKey: string;
  initialImprovement: string;
  initialFeeling: string;
}) {
  const [improvement, setImprovement] = useState(initialImprovement);
  const [feeling, setFeeling] = useState(initialFeeling);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleCommit() {
    startTransition(async () => {
      await saveDebriefAction(dateKey, improvement, feeling);
      setSaved(true);
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Debrief</h3>
      <div className="mb-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">What to improve tomorrow</span>
          <textarea
            value={improvement}
            onChange={(e) => {
              setImprovement(e.target.value);
              setSaved(false);
            }}
            className="min-h-[80px] resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
            placeholder="What would you change about today?"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">How I actually felt</span>
          <textarea
            value={feeling}
            onChange={(e) => {
              setFeeling(e.target.value);
              setSaved(false);
            }}
            className="min-h-[80px] resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
            placeholder="Be honest — this is for you."
          />
        </label>
      </div>
      <div className="flex gap-2">
        <Link
          href="/dashboard"
          className="flex-1 rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-surface-raised"
        >
          Dashboard
        </Link>
        <button
          type="button"
          disabled={isPending}
          onClick={handleCommit}
          className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Saving..." : saved ? "Saved ✓" : "Commit Daily Recap"}
        </button>
      </div>
    </section>
  );
}

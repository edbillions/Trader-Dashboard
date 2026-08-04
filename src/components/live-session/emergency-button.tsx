"use client";

import { useState, useTransition } from "react";
import { triggerEmergencyPauseAction } from "@/lib/actions/live-session";

export function EmergencyButton({
  dateKey,
  paused,
  secondsRemaining,
  disabled,
}: {
  dateKey: string;
  paused: boolean;
  secondsRemaining: number;
  disabled: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleTrigger() {
    startTransition(async () => {
      await triggerEmergencyPauseAction(dateKey);
      window.location.reload();
    });
  }

  if (paused) {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    return (
      <section className="rounded-xl border border-loss/40 bg-loss-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-loss">
          Emergency pause active
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-loss">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
        <p className="mt-2 text-sm text-foreground">
          Step away from the charts. Breathe. This pause protects your account
          — and your future self. When the timer clears, re-check the plan
          before your next trade, don&apos;t just re-enter.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      {confirming ? (
        <div>
          <p className="mb-3 text-sm text-foreground">
            This locks out trading for 15 minutes and starts a recovery
            sequence. Confirm?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleTrigger}
              className="flex-1 rounded-lg bg-loss px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isPending ? "Starting..." : "Yes, pause me"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setConfirming(true)}
          className="w-full rounded-lg border-2 border-loss bg-loss-muted px-4 py-3 text-sm font-bold uppercase tracking-wide text-loss disabled:opacity-50"
        >
          I&apos;m about to crash out
        </button>
      )}
    </section>
  );
}

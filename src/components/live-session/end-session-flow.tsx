"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/pnl";
import { endSessionAction } from "@/lib/actions/live-session";

export function EndSessionFlow({
  dateKey,
  netPnlToday,
  tradesTaken,
  crashoutScore,
}: {
  dateKey: string;
  netPnlToday: number;
  tradesTaken: number;
  crashoutScore: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "complete">("idle");
  const [isPending, startTransition] = useTransition();

  function handleEnd() {
    startTransition(async () => {
      await endSessionAction(dateKey);
      setStep("complete");
    });
  }

  if (step === "complete") {
    return (
      <section className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Session complete</h3>
        <p className="mb-4 text-xs text-muted">
          Your discipline is locked in for today.
        </p>
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted">Net P&amp;L</p>
            <p
              className={`text-lg font-bold ${netPnlToday >= 0 ? "text-profit" : "text-loss"}`}
            >
              {formatCurrency(netPnlToday)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Peak meter</p>
            <p className="text-lg font-bold text-foreground">{crashoutScore.toFixed(1)}/10</p>
          </div>
          <div>
            <p className="text-xs text-muted">Trades</p>
            <p className="text-lg font-bold text-foreground">{tradesTaken}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/live-session/recap/${dateKey}`)}
            className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Recap
          </button>
          <Link
            href="/trades"
            className="flex-1 rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-surface-raised"
          >
            Review trades
          </Link>
        </div>
      </section>
    );
  }

  if (step === "confirm") {
    return (
      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-1 text-sm font-semibold text-foreground">End your session?</h3>
        <p className="mb-4 text-sm text-muted">
          You&apos;re choosing to stop for the day and lock in your discipline.
          You won&apos;t be able to log more trades after this.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep("idle")}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
          >
            Keep trading
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleEnd}
            className="flex-1 rounded-lg bg-loss px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Locking in..." : "Lock in & end"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStep("confirm")}
      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-raised"
    >
      End session
    </button>
  );
}

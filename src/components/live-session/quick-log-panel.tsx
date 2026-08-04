"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { quickLogTradeAction } from "@/lib/actions/live-session";

const INSTRUMENTS = ["NQ", "ES", "MNQ", "MES", "GC", "MCL"];
const QUICK_AMOUNTS = [50, 100, 200, 500];

export function QuickLogPanel({
  dateKey,
  disabled,
  disabledReason,
}: {
  dateKey: string;
  disabled: boolean;
  disabledReason?: string;
}) {
  const [outcome, setOutcome] = useState<"win" | "loss" | "be">("win");
  const [instrument, setInstrument] = useState("NQ");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [setup, setSetup] = useState("");
  const [emotionTag, setEmotionTag] = useState("");
  const [amount, setAmount] = useState<number>(100);
  const [isPending, startTransition] = useTransition();

  function handleLog() {
    startTransition(async () => {
      await quickLogTradeAction({
        dateKey,
        outcome,
        amount,
        instrument,
        direction,
        setup: setup.trim() || undefined,
        emotionTag: emotionTag.trim() || undefined,
      });
      window.location.reload();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Log</h3>

      {disabled && (
        <p className="mb-3 rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted">
          {disabledReason ?? "Quick Log is unavailable right now."}
        </p>
      )}

      <div className="mb-3 grid grid-cols-3 gap-2">
        {(["win", "loss", "be"] as const).map((o) => (
          <button
            key={o}
            type="button"
            disabled={disabled}
            onClick={() => setOutcome(o)}
            className={clsx(
              "rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50",
              outcome === o
                ? o === "win"
                  ? "border-profit/40 bg-profit-muted text-profit"
                  : o === "loss"
                    ? "border-loss/40 bg-loss-muted text-loss"
                    : "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {o === "win" ? "+$ Win" : o === "loss" ? "-$ Loss" : "BE"}
          </button>
        ))}
      </div>

      {outcome !== "be" && (
        <div className="mb-3">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                disabled={disabled}
                onClick={() => setAmount(a)}
                className={clsx(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50",
                  amount === a
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                +${a}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={0}
            step={1}
            disabled={disabled}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
            placeholder="Custom amount"
          />
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <input
            list="live-session-instruments"
            disabled={disabled}
            value={instrument}
            onChange={(e) => setInstrument(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
            placeholder="Instrument"
          />
          <datalist id="live-session-instruments">
            {INSTRUMENTS.map((i) => (
              <option key={i} value={i} />
            ))}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(["long", "short"] as const).map((d) => (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => setDirection(d)}
              className={clsx(
                "rounded-lg border px-3 py-2 text-xs font-semibold uppercase disabled:opacity-50",
                direction === d
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <input
        disabled={disabled}
        value={setup}
        onChange={(e) => setSetup(e.target.value)}
        className="mb-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
        placeholder="Setup (optional)"
      />
      <input
        disabled={disabled}
        value={emotionTag}
        onChange={(e) => setEmotionTag(e.target.value)}
        className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
        placeholder="Emotion tag (optional)"
      />

      <button
        type="button"
        disabled={disabled || isPending}
        onClick={handleLog}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "Logging..." : "Log trade"}
      </button>
    </section>
  );
}

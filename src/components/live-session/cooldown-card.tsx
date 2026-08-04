import { clsx } from "clsx";
import type { CooldownState } from "@/lib/domain/cooldown";

export function CooldownCard({ cooldown }: { cooldown: CooldownState }) {
  const minutes = Math.floor(cooldown.secondsRemaining / 60);
  const seconds = cooldown.secondsRemaining % 60;

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Trade Cooldown</h3>
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            cooldown.active
              ? "bg-loss-muted text-loss"
              : "bg-profit-muted text-profit",
          )}
        >
          {cooldown.active ? "Active" : "Clear"}
        </span>
      </div>

      {cooldown.active ? (
        <p className="text-3xl font-bold tabular-nums text-foreground">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
      ) : (
        <p className="text-3xl font-bold text-profit">Ready</p>
      )}

      <p className="mt-1 text-xs text-muted">
        {cooldown.minutesSinceLastTrade != null
          ? `${cooldown.minutesSinceLastTrade} min since your last trade.`
          : "No trades logged yet today."}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">
        {cooldown.recommendedAction}
      </p>
    </section>
  );
}

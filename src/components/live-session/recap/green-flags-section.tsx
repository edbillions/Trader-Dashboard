import { clsx } from "clsx";
import type { GreenFlagItem } from "@/lib/domain/green-flags";
import type { TiltSignal } from "@/lib/domain/tilt";

const SIGNAL_LABELS: Record<TiltSignal["type"], string> = {
  overtrading: "Overtrading",
  revenge_trading: "Revenge trading",
  size_up_after_loss: "Sized up after a loss",
  off_plan: "Off plan",
};

export function GreenFlagsSection({
  greenFlags,
  tiltSignals,
}: {
  greenFlags: GreenFlagItem[];
  tiltSignals: TiltSignal[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Green Flags</h3>
        <ul className="flex flex-col gap-1.5 text-sm">
          {greenFlags.map((f) => (
            <li
              key={f.label}
              className={clsx(f.passed ? "text-profit" : "text-loss")}
            >
              {f.passed ? "✓" : "✕"} {f.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Rule Breaches</h3>
        {tiltSignals.length === 0 ? (
          <p className="text-sm text-profit">
            ✓ Rules held all day. This is the real win. Profit is a byproduct.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm text-loss">
            {tiltSignals.map((s, i) => (
              <li key={`${s.type}-${i}`}>
                ✕ {SIGNAL_LABELS[s.type]}: {s.detail}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

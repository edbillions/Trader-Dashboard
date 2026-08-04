import { clsx } from "clsx";
import type { CrashoutMeterResult, PermissionCheck } from "@/lib/domain/crashout-meter";
import { SemicircleGauge } from "@/components/live-session/semicircle-gauge";

const STATE_COLOR: Record<CrashoutMeterResult["state"], string> = {
  calm: "text-profit",
  elevated: "text-yellow-500",
  peak: "text-loss",
};

const TONE_BANNER: Record<string, string> = {
  ok: "border-profit/40 bg-profit-muted text-profit",
  watch: "border-yellow-500/40 bg-yellow-500/10 text-yellow-500",
  alert: "border-loss/40 bg-loss-muted text-loss",
};

export function CrashoutMeterPanel({
  meter,
  permission,
}: {
  meter: CrashoutMeterResult;
  permission: PermissionCheck;
}) {
  const colorClass = STATE_COLOR[meter.state];

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Crashout Meter</h3>

      <SemicircleGauge value={meter.score} colorClass={colorClass} label={meter.stateLabel} />

      {meter.safetyBanner && (
        <div
          className={clsx(
            "mt-3 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide",
            TONE_BANNER[meter.safetyBanner.tone],
          )}
        >
          {meter.safetyBanner.message}
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Can I take another trade?
        </p>
        <p
          className={clsx(
            "mt-1 text-sm font-semibold",
            permission.allowed ? "text-profit" : "text-loss",
          )}
        >
          {permission.allowed ? "Yes — you're clear." : "Not yet."}
        </p>
        {permission.reasons.length > 0 && (
          <ul className="mt-1 list-inside list-disc text-xs text-muted">
            {permission.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Next best action
        </p>
        <p className="mt-1 text-sm text-foreground">{meter.nextBestAction}</p>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Why your score changed
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {meter.factors.map((f, i) => (
            <li
              key={`${f.label}-${i}`}
              className={clsx(
                "text-xs",
                f.positive ? "text-profit" : f.delta > 0 ? "text-loss" : "text-muted",
              )}
            >
              {f.positive ? "✓" : f.delta > 0 ? "▲" : "—"} {f.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { clsx } from "clsx";

export function Gauge({
  label,
  usedLabel,
  limitLabel,
  pct,
  danger,
}: {
  label: string;
  usedLabel: string;
  limitLabel: string;
  pct: number | null;
  danger?: boolean;
}) {
  const isDanger = danger ?? (pct != null && pct >= 100);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-xs text-muted">
          {usedLabel}{" "}
          <span className="text-foreground/70">of {limitLabel}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            pct == null
              ? "bg-border"
              : isDanger
                ? "bg-loss"
                : pct >= 75
                  ? "bg-accent"
                  : "bg-profit",
          )}
          style={{ width: `${pct != null ? Math.min(pct, 100) : 0}%` }}
        />
      </div>
    </div>
  );
}

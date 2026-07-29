import { clsx } from "clsx";

export function StreakCard({
  label,
  icon,
  count,
  countLabel,
  caption,
  subtitle,
  tone,
}: {
  label: string;
  icon: string;
  count: number;
  countLabel: string;
  caption: string;
  subtitle?: string;
  tone: "profit" | "loss" | "accent";
}) {
  const toneClass =
    tone === "profit"
      ? "text-profit"
      : tone === "loss"
        ? "text-loss"
        : "text-accent";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-center py-2 text-center">
        <span className="text-2xl">{icon}</span>
        <span className={clsx("mt-1 text-3xl font-bold", toneClass)}>
          {count}
        </span>
        <span className={clsx("text-xs font-medium", toneClass)}>
          {countLabel}
        </span>
        <p className="mt-1 text-[11px] text-muted">{caption}</p>
      </div>
    </div>
  );
}

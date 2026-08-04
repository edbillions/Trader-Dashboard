// A 0-max semicircular arc gauge — the Emotional Risk / Discipline Arc
// visual language from the reference app. `Gauge` (ui/gauge.tsx) is a
// linear bar and can't represent this shape, so this is a small dedicated
// sibling, feature-scoped rather than promoted to ui/.
export function SemicircleGauge({
  value,
  max = 10,
  colorClass,
  label,
  sublabel,
}: {
  value: number;
  max?: number;
  colorClass: string; // e.g. "text-profit" | "text-loss" | "text-accent" | "text-yellow-500"
  label?: string;
  sublabel?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg viewBox="0 0 200 110" className="w-full">
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          pathLength={100}
        />
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          className={colorClass}
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {value.toFixed(1)}
          <span className="text-base font-medium text-muted">/{max}</span>
        </span>
        {label && (
          <span className={`text-xs font-semibold uppercase tracking-wide ${colorClass}`}>
            {label}
          </span>
        )}
        {sublabel && <span className="text-[11px] text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}

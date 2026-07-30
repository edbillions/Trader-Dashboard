export function BiasSplitBar({
  bullishPct,
  bearishPct,
  rangePct,
}: {
  bullishPct: number;
  bearishPct: number;
  rangePct: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
        <span className="text-profit">Bullish {bullishPct}%</span>
        <span className="text-muted">Range {rangePct}%</span>
        <span className="text-loss">Bearish {bearishPct}%</span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
        <div className="h-full bg-profit" style={{ width: `${bullishPct}%` }} />
        <div className="h-full bg-muted" style={{ width: `${rangePct}%` }} />
        <div className="h-full bg-loss" style={{ width: `${bearishPct}%` }} />
      </div>
    </div>
  );
}

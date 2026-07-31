// Stand-in for TradeZella's proprietary "Zella Scale" visual — same
// at-a-glance red/green horizontal read, built from our own R-multiple data
// instead of an undisclosed formula. Centered at 0R; fills right (green) for
// positive R, left (red) for negative R, clamped to +/-maxAbs.
export function RMultipleBar({
  rMultiple,
  maxAbs = 3,
  width = 96,
}: {
  rMultiple: number | null;
  maxAbs?: number;
  width?: number;
}) {
  if (rMultiple == null) {
    return (
      <div
        className="h-2 shrink-0 rounded-full bg-surface-raised"
        style={{ width }}
      />
    );
  }

  const clamped = Math.max(-maxAbs, Math.min(maxAbs, rMultiple));
  const fillPct = (Math.abs(clamped) / maxAbs) * 50;
  const isPositive = clamped >= 0;

  return (
    <div
      className="relative h-2 shrink-0 overflow-hidden rounded-full bg-surface-raised"
      style={{ width }}
    >
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" />
      <div
        className={
          isPositive
            ? "absolute left-1/2 top-0 h-full bg-profit"
            : "absolute top-0 h-full bg-loss"
        }
        style={
          isPositive
            ? { width: `${fillPct}%` }
            : { right: "50%", width: `${fillPct}%` }
        }
      />
    </div>
  );
}

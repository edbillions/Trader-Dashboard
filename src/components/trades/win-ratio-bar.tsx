export function WinRatioBar({
  winRate,
  winners,
  losers,
}: {
  winRate: number | null;
  winners: number;
  losers: number;
}) {
  const winPct = winRate ?? 0;

  return (
    <div>
      <p className="mb-3 text-2xl font-bold text-foreground">
        {winRate != null ? `${winRate.toFixed(2)}%` : "—"}
      </p>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
        <div className="h-full bg-loss" style={{ width: `${100 - winPct}%` }} />
        <div className="h-full bg-profit" style={{ width: `${winPct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        Winners: <span className="font-medium text-profit">{winners}</span>{" "}
        Losers: <span className="font-medium text-loss">{losers}</span>
      </p>
    </div>
  );
}

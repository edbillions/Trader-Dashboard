export function ProgressBar({ progress }: { progress: number }) {
  const clamped = Math.min(100, Math.max(0, progress));
  const positive = progress >= 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
      <div
        className={positive ? "h-full bg-profit" : "h-full bg-loss"}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

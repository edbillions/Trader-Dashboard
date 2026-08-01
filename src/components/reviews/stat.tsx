export function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={
          positive === undefined
            ? "mt-1 text-lg font-semibold text-foreground"
            : positive
              ? "mt-1 text-lg font-semibold text-profit"
              : "mt-1 text-lg font-semibold text-loss"
        }
      >
        {value}
      </p>
    </div>
  );
}

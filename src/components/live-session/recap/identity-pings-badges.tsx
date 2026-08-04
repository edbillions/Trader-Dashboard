import { clsx } from "clsx";
import type { IdentityPing } from "@/lib/domain/identity-pings";

export function IdentityPingsBadges({
  title,
  pings,
}: {
  title: string;
  pings: IdentityPing[];
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {pings.length === 0 ? (
        <p className="text-xs text-muted">No pings earned today.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {pings.map((p) => (
            <span
              key={p.label}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                p.positive
                  ? "border-profit/40 bg-profit-muted text-profit"
                  : "border-loss/40 bg-loss-muted text-loss",
              )}
            >
              {p.points > 0 ? "+" : ""}
              {p.points} {p.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

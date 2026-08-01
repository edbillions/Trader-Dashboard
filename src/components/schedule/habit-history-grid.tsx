import { clsx } from "clsx";

interface HabitWithHistory {
  id: string;
  label: string;
  history: Set<string>;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function HabitHistoryGrid({
  habits,
  days = 14,
}: {
  habits: HabitWithHistory[];
  days?: number;
}) {
  if (habits.length === 0) return null;

  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Last {days} days
      </h2>
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-2">
          {habits.map((h) => (
            <div key={h.id} className="flex items-center gap-3">
              <span className="w-48 shrink-0 truncate text-xs text-muted">
                {h.label}
              </span>
              <div className="flex gap-1">
                {dates.map((d) => {
                  const done = h.history.has(dateKey(d));
                  return (
                    <div
                      key={d.toISOString()}
                      title={dateKey(d)}
                      className={clsx(
                        "h-3.5 w-3.5 shrink-0 rounded-sm",
                        done ? "bg-accent" : "bg-surface-raised",
                      )}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

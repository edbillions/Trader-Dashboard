import { clsx } from "clsx";
import { FITNESS_SPLIT } from "@/lib/schedule-data";

const DAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function FitnessSplitTable() {
  const today = new Date().getDay();

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        This week&apos;s training
      </h2>
      <div className="flex flex-col gap-1.5">
        {DAY_ORDER.map((day) => {
          const isToday = day === today;
          return (
            <div
              key={day}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                isToday && "border border-accent/40 bg-accent/10",
              )}
            >
              <span
                className={clsx(
                  "w-24 shrink-0 text-xs font-semibold uppercase tracking-wide",
                  isToday ? "text-accent" : "text-muted",
                )}
              >
                {DAY_LABELS[day]}
              </span>
              <span className="text-sm text-foreground">
                {FITNESS_SPLIT[day]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

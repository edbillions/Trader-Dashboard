import { clsx } from "clsx";
import { toggleHabitLogAction } from "@/lib/actions/habits";

interface HabitRow {
  id: string;
  label: string;
  doneToday: boolean;
  streak: number;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function HabitChecklist({ habits }: { habits: HabitRow[] }) {
  const doneCount = habits.filter((h) => h.doneToday).length;
  const date = todayKey();

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Today&apos;s habits
        </h2>
        <span className="text-sm font-semibold text-accent">
          {doneCount}/{habits.length} done
        </span>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-muted">
          No habits yet — add some in &quot;Manage habits&quot; below.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {habits.map((h) => (
            <form key={h.id} action={toggleHabitLogAction}>
              <input type="hidden" name="habitId" value={h.id} />
              <input type="hidden" name="date" value={date} />
              <input
                type="hidden"
                name="done"
                value={h.doneToday ? "true" : "false"}
              />
              {/* The whole row is the submit target, not just the small
                  checkbox square — a 20px hit area was too easy to miss. */}
              <button
                type="submit"
                aria-label={
                  h.doneToday
                    ? `Mark "${h.label}" as not done`
                    : `Mark "${h.label}" as done`
                }
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-surface-raised"
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    h.doneToday
                      ? "border-accent bg-accent text-white"
                      : "border-border",
                  )}
                >
                  {h.doneToday && (
                    <span className="text-xs leading-none">✓</span>
                  )}
                </span>
                <span
                  className={clsx(
                    "flex-1 text-sm",
                    h.doneToday ? "text-muted line-through" : "text-foreground",
                  )}
                >
                  {h.label}
                </span>
                {h.streak > 0 && (
                  <span className="whitespace-nowrap text-xs font-medium text-accent">
                    🔥 {h.streak}
                  </span>
                )}
              </button>
            </form>
          ))}
        </div>
      )}
    </section>
  );
}

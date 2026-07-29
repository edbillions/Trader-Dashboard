import Link from "next/link";
import { clsx } from "clsx";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { AddTodoForm } from "@/components/todo/add-todo-form";
import { listTodos, getTodosForMonth } from "@/lib/data/todos";
import { toggleTodoAction, deleteTodoAction } from "@/lib/actions/todos";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function TodoPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    year?: string;
    month?: string;
  }>;
}) {
  const params = await searchParams;
  const view = params.view === "calendar" ? "calendar" : "list";

  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth();

  return (
    <div>
      <PageHeader
        title="To-Do"
        description="Tasks and reminders, with a calendar view for anything with a due date."
        actions={
          <div className="flex gap-2">
            <Link
              href="/todo?view=list"
              className={clsx(
                "rounded-lg border px-3 py-1.5 text-xs font-medium",
                view === "list"
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              List
            </Link>
            <Link
              href={`/todo?view=calendar&year=${year}&month=${month}`}
              className={clsx(
                "rounded-lg border px-3 py-1.5 text-xs font-medium",
                view === "calendar"
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              Calendar
            </Link>
          </div>
        }
      />

      {view === "list" ? <ListView /> : <CalendarView year={year} month={month} />}
    </div>
  );
}

async function ListView() {
  const todos = await listTodos();
  const today = dateKey(new Date());

  const open = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  const overdue = open.filter(
    (t) => t.dueDate && dateKey(t.dueDate) < today,
  );
  const dueToday = open.filter(
    (t) => t.dueDate && dateKey(t.dueDate) === today,
  );
  const upcoming = open.filter(
    (t) => t.dueDate && dateKey(t.dueDate) > today,
  );
  const noDueDate = open.filter((t) => !t.dueDate);

  return (
    <div>
      <section className="mb-8">
        <AddTodoForm />
      </section>

      {todos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Nothing on your list yet.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {overdue.length > 0 && (
            <TodoGroup title="Overdue" items={overdue} accent="loss" />
          )}
          {dueToday.length > 0 && (
            <TodoGroup title="Due today" items={dueToday} accent="accent" />
          )}
          {upcoming.length > 0 && (
            <TodoGroup title="Upcoming" items={upcoming} />
          )}
          {noDueDate.length > 0 && (
            <TodoGroup title="No due date" items={noDueDate} />
          )}
          {completed.length > 0 && (
            <TodoGroup title="Completed" items={completed} />
          )}
        </div>
      )}
    </div>
  );
}

function TodoGroup({
  title,
  items,
  accent,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listTodos>>;
  accent?: "loss" | "accent";
}) {
  return (
    <section>
      <h2
        className={clsx(
          "mb-2 text-sm font-semibold",
          accent === "loss"
            ? "text-loss"
            : accent === "accent"
              ? "text-accent"
              : "text-foreground",
        )}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <div className="flex items-start gap-3">
              <form action={toggleTodoAction}>
                <input type="hidden" name="id" value={t.id} />
                <input
                  type="hidden"
                  name="completed"
                  value={t.completed ? "true" : "false"}
                />
                <button
                  type="submit"
                  className={clsx(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    t.completed
                      ? "border-accent bg-accent text-white"
                      : "border-border hover:border-accent",
                  )}
                >
                  {t.completed && (
                    <span className="text-[10px] leading-none">✓</span>
                  )}
                </button>
              </form>
              <div>
                <p
                  className={clsx(
                    "text-sm font-medium",
                    t.completed
                      ? "text-muted line-through"
                      : "text-foreground",
                  )}
                >
                  {t.title}
                </p>
                {t.notes && (
                  <p className="mt-0.5 text-xs text-muted">{t.notes}</p>
                )}
                {t.dueDate && (
                  <p className="mt-0.5 text-xs text-muted">
                    Due {dateKey(t.dueDate)}
                  </p>
                )}
              </div>
            </div>
            <form action={deleteTodoAction}>
              <input type="hidden" name="id" value={t.id} />
              <ConfirmSubmitButton
                confirmMessage={`Delete "${t.title}"?`}
                className="shrink-0 text-xs font-medium text-loss hover:underline"
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}

async function CalendarView({ year, month }: { year: number; month: number }) {
  const todos = await getTodosForMonth(year, month);
  const byDate = new Map<string, typeof todos>();
  for (const t of todos) {
    if (!t.dueDate) continue;
    const key = dateKey(t.dueDate);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(t);
  }

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth =
    month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth =
    month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = dateKey(new Date());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/todo?view=calendar&year=${prevMonth.year}&month=${prevMonth.month}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          ← Prev
        </Link>
        <span className="text-sm font-medium text-foreground">
          {monthLabel}
        </span>
        <Link
          href={`/todo?view=calendar&year=${nextMonth.year}&month=${nextMonth.month}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          Next →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-medium text-muted">
            {d}
          </div>
        ))}
        {cells.map((dayNum, i) => {
          if (dayNum == null) return <div key={i} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const items = byDate.get(key) ?? [];
          const isToday = key === today;

          return (
            <div
              key={i}
              className={clsx(
                "flex min-h-24 flex-col gap-1 rounded-lg border p-2",
                isToday ? "border-accent bg-accent/5" : "border-border bg-surface",
              )}
            >
              <span className="text-xs font-medium text-muted">{dayNum}</span>
              {items.map((t) => (
                <span
                  key={t.id}
                  className={clsx(
                    "truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
                    t.completed
                      ? "bg-surface-raised text-muted line-through"
                      : "bg-accent/15 text-accent",
                  )}
                  title={t.title}
                >
                  {t.title}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

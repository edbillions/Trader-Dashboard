import Link from "next/link";
import { clsx } from "clsx";
import { toggleTodoAction } from "@/lib/actions/todos";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export function DashboardTodoWidget({ todos }: { todos: Todo[] }) {
  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          To-do
        </p>
        <Link
          href="/todo"
          aria-label="View all to-dos"
          className="text-muted hover:text-accent"
        >
          📁
        </Link>
      </div>
      <h3 className="mb-3 text-lg font-bold text-foreground">What to do</h3>

      {todos.length === 0 ? (
        <p className="text-sm text-muted">Nothing on your list yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {todos.map((t) => (
            <form key={t.id} action={toggleTodoAction} className="flex items-center gap-2.5">
              <input type="hidden" name="id" value={t.id} />
              <input
                type="hidden"
                name="completed"
                value={t.completed ? "true" : "false"}
              />
              <button
                type="submit"
                aria-label={
                  t.completed
                    ? `Mark "${t.title}" as not done`
                    : `Mark "${t.title}" as done`
                }
                className={clsx(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  t.completed
                    ? "border-accent bg-accent text-white"
                    : "border-border hover:border-accent",
                )}
              >
                {t.completed && (
                  <span className="text-[10px] leading-none">✓</span>
                )}
              </button>
              <span
                className={clsx(
                  "text-left text-sm",
                  t.completed
                    ? "text-muted line-through"
                    : "text-foreground",
                )}
              >
                {t.title}
              </span>
            </form>
          ))}
        </div>
      )}
    </section>
  );
}

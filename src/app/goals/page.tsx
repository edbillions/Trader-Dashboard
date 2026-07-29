import Link from "next/link";
import { clsx } from "clsx";
import { PageHeader } from "@/components/layout/page-header";
import { listLifeGoals, goalProgress } from "@/lib/data/goals-tracker";
import { updateProgressAction } from "@/lib/actions/goals-tracker";
import { AddGoalForm } from "@/components/goals/add-goal-form";
import { GoalCard } from "@/components/goals/goal-card";

export const dynamic = "force-dynamic";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category =
    params.category === "business" || params.category === "personal"
      ? params.category
      : null;

  const allGoals = await listLifeGoals();
  const primary = allGoals.find((g) => g.isPrimary) ?? null;
  const visible = allGoals.filter(
    (g) => !g.isPrimary && (!category || g.category === category),
  );

  const primaryProgress = primary ? goalProgress(primary) : null;

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Business and personal goals, with a live progress tracker. Ask the AI chat button in the corner how you're tracking."
      />

      <div className="mb-6 flex gap-2">
        <Link
          href="/goals"
          className={clsx(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            !category
              ? "border-accent bg-accent/10 text-foreground"
              : "border-border text-muted hover:text-foreground",
          )}
        >
          All
        </Link>
        <Link
          href="/goals?category=business"
          className={clsx(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            category === "business"
              ? "border-accent bg-accent/10 text-foreground"
              : "border-border text-muted hover:text-foreground",
          )}
        >
          Business
        </Link>
        <Link
          href="/goals?category=personal"
          className={clsx(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            category === "personal"
              ? "border-accent bg-accent/10 text-foreground"
              : "border-border text-muted hover:text-foreground",
          )}
        >
          Personal
        </Link>
      </div>

      <section className="mb-8">
        <AddGoalForm />
      </section>

      {primary && (
        <section className="mb-8 rounded-xl border-l-4 border-l-accent border-y border-r border-border bg-gradient-to-r from-accent/10 via-surface to-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Main focus · {primary.category}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">
            {primary.title}
          </h2>
          {primary.description && (
            <p className="mt-1 text-sm text-muted">{primary.description}</p>
          )}
          {primary.targetValue != null ? (
            <div className="mt-4 flex items-end gap-6">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {primary.currentValue}
                  {primary.unit ?? ""}
                </p>
                <p className="text-xs text-muted">
                  of {primary.targetValue}
                  {primary.unit ?? ""} target
                </p>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>Progress to target</span>
                  <span>{primaryProgress?.toFixed(0) ?? 0}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-purple-400"
                    style={{ width: `${primaryProgress ?? 0}%` }}
                  />
                </div>
                <form
                  action={updateProgressAction}
                  className="mt-2 flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={primary.id} />
                  <input
                    type="number"
                    step="any"
                    name="currentValue"
                    defaultValue={primary.currentValue}
                    className="w-24 rounded-lg border border-border bg-surface-raised px-2 py-1 text-xs text-foreground"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-surface-raised"
                  >
                    Update progress
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No target value set.</p>
          )}
        </section>
      )}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No {category ?? ""} goals yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((goal, i) => (
            <GoalCard key={goal.id} goal={goal} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

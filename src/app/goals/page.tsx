import Link from "next/link";
import { clsx } from "clsx";
import { PageHeader } from "@/components/layout/page-header";
import {
  listLifeGoals,
  goalProgress,
  goalStatus,
  type GoalStatus,
} from "@/lib/data/goals-tracker";
import { updateProgressAction } from "@/lib/actions/goals-tracker";
import { AddGoalForm } from "@/components/goals/add-goal-form";
import { GoalCard } from "@/components/goals/goal-card";

export const dynamic = "force-dynamic";

const TIERS = ["daily", "weekly", "monthly", "quarterly", "annual"] as const;
const STATUSES: GoalStatus[] = ["active", "completed", "failed"];

type FilterState = {
  category: string | null;
  tier: string | null;
  status: string | null;
};

function buildGoalsHref(state: FilterState): string {
  const search = new URLSearchParams();
  if (state.category) search.set("category", state.category);
  if (state.tier) search.set("tier", state.tier);
  if (state.status) search.set("status", state.status);
  const qs = search.toString();
  return qs ? `/goals?${qs}` : "/goals";
}

function pillClass(active: boolean): string {
  return clsx(
    "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize",
    active
      ? "border-accent bg-accent/10 text-foreground"
      : "border-border text-muted hover:text-foreground",
  );
}

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tier?: string; status?: string }>;
}) {
  const params = await searchParams;
  const category =
    params.category === "business" || params.category === "personal"
      ? params.category
      : null;
  const tier = (TIERS as readonly string[]).includes(params.tier ?? "")
    ? (params.tier as string)
    : null;
  const status = (STATUSES as readonly string[]).includes(params.status ?? "")
    ? (params.status as GoalStatus)
    : null;

  const allGoals = await listLifeGoals();
  const primary = allGoals.find((g) => g.isPrimary) ?? null;
  const visible = allGoals.filter(
    (g) =>
      !g.isPrimary &&
      (!category || g.category === category) &&
      (!tier || g.tier === tier) &&
      (!status || goalStatus(g) === status),
  );

  const primaryProgress = primary ? goalProgress(primary) : null;

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Business and personal goals, with a live progress tracker. Ask the AI chat button in the corner how you're tracking."
      />

      <p className="mb-4 text-xs text-muted">
        {visible.length} goal{visible.length === 1 ? "" : "s"} total
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <Link href={buildGoalsHref({ category: null, tier, status })} className={pillClass(!category)}>
          All
        </Link>
        <Link
          href={buildGoalsHref({ category: "business", tier, status })}
          className={pillClass(category === "business")}
        >
          Business
        </Link>
        <Link
          href={buildGoalsHref({ category: "personal", tier, status })}
          className={pillClass(category === "personal")}
        >
          Personal
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Link href={buildGoalsHref({ category, tier: null, status })} className={pillClass(!tier)}>
          All tiers
        </Link>
        {TIERS.map((t) => (
          <Link
            key={t}
            href={buildGoalsHref({ category, tier: t, status })}
            className={pillClass(tier === t)}
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={buildGoalsHref({ category, tier, status: null })} className={pillClass(!status)}>
          All statuses
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={buildGoalsHref({ category, tier, status: s })}
            className={pillClass(status === s)}
          >
            {s}
          </Link>
        ))}
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
          No goals match these filters.
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

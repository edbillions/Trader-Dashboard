import { clsx } from "clsx";
import { goalProgress, goalStatus } from "@/lib/data/goals-tracker";
import {
  deleteLifeGoalAction,
  setPrimaryGoalAction,
  toggleAchievedAction,
  updateProgressAction,
} from "@/lib/actions/goals-tracker";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

interface Goal {
  id: string;
  category: string;
  tier: string | null;
  title: string;
  description: string | null;
  isPrimary: boolean;
  targetValue: number | null;
  currentValue: number;
  unit: string | null;
  direction: string;
  targetDate: Date | null;
  achieved: boolean;
}

const STATUS_BADGE: Record<
  ReturnType<typeof goalStatus>,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-surface-raised text-muted" },
  completed: { label: "Completed", className: "bg-profit-muted text-profit" },
  failed: { label: "Failed", className: "bg-loss-muted text-loss" },
};

export function GoalCard({ goal, index }: { goal: Goal; index?: number }) {
  const progress = goalProgress(goal);
  const status = goalStatus(goal);
  const isLimit = goal.direction === "limit";
  const overCap = isLimit && goal.targetValue != null && goal.currentValue >= goal.targetValue;

  const barColor = goal.achieved
    ? "bg-profit"
    : overCap
      ? "bg-loss"
      : isLimit
        ? "bg-orange-500"
        : "bg-accent";

  return (
    <div
      className={clsx(
        "rounded-xl border p-4",
        goal.achieved
          ? "border-profit/30 bg-profit-muted/40"
          : status === "failed"
            ? "border-loss/30 bg-loss-muted/40"
            : "border-border bg-surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {index != null && (
              <span className="font-mono text-xs text-muted">
                {String(index).padStart(2, "0")}
              </span>
            )}
            <span
              className={clsx(
                "text-sm font-semibold",
                goal.achieved ? "text-muted line-through" : "text-foreground",
              )}
            >
              {goal.title}
            </span>
            <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              {goal.category}
            </span>
            {goal.tier && (
              <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                {goal.tier}
              </span>
            )}
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                STATUS_BADGE[status].className,
              )}
            >
              {STATUS_BADGE[status].label}
            </span>
            {overCap && !goal.achieved && (
              <span className="rounded-full bg-loss/20 px-2 py-0.5 text-[10px] font-semibold text-loss">
                Over cap
              </span>
            )}
          </div>
          {goal.description && (
            <p className="mt-1 text-xs text-muted">{goal.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs">
          {!goal.isPrimary && (
            <form action={setPrimaryGoalAction}>
              <input type="hidden" name="id" value={goal.id} />
              <button
                type="submit"
                className="font-medium text-muted hover:text-accent"
              >
                Main focus
              </button>
            </form>
          )}
          <form action={toggleAchievedAction}>
            <input type="hidden" name="id" value={goal.id} />
            <input
              type="hidden"
              name="achieved"
              value={goal.achieved ? "true" : "false"}
            />
            <button
              type="submit"
              className={clsx(
                "font-medium",
                goal.achieved ? "text-profit" : "text-muted hover:text-foreground",
              )}
            >
              {goal.achieved ? "Achieved ✓" : "Mark achieved"}
            </button>
          </form>
          <form action={deleteLifeGoalAction}>
            <input type="hidden" name="id" value={goal.id} />
            <ConfirmSubmitButton
              confirmMessage={`Delete "${goal.title}"? This can't be undone.`}
              className="font-medium text-loss hover:underline"
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {goal.targetValue != null && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-end justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Progress
            </span>
            {progress != null && (
              <span className="text-lg font-bold leading-none text-foreground">
                {progress.toFixed(0)}%
              </span>
            )}
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className={clsx("h-full rounded-full", barColor)}
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            {goal.currentValue}
            {goal.unit ?? ""} / {goal.targetValue}
            {goal.unit ?? ""}
            {isLimit ? " cap" : ""}
          </p>
          <form
            action={updateProgressAction}
            className="mt-2 flex items-center gap-2"
          >
            <input type="hidden" name="id" value={goal.id} />
            <input
              type="number"
              step="any"
              name="currentValue"
              defaultValue={goal.currentValue}
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
      )}

      {goal.targetDate && (
        <p className="mt-2 text-xs text-muted">
          Target date {goal.targetDate.toISOString().slice(0, 10)}
        </p>
      )}
    </div>
  );
}

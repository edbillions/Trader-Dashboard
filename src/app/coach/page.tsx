import { PageHeader } from "@/components/layout/page-header";
import { Field, TextInput, Select } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getCoachData } from "@/lib/data/coach";
import { formatCurrency } from "@/lib/pnl";
import {
  createGoalAction,
  createProcessGoalAction,
  deleteGoalAction,
  deleteProcessGoalAction,
} from "@/lib/actions/goals";

export const dynamic = "force-dynamic";

const TILT_LABELS: Record<string, string> = {
  overtrading: "Overtrading",
  revenge_trading: "Revenge trading",
  size_up_after_loss: "Sized up after a loss",
  off_plan: "Off plan",
};

export default async function CoachPage() {
  const data = await getCoachData();

  return (
    <div>
      <PageHeader
        title="Coach"
        description="Streaks, discipline, tilt signals, and process goals."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Journaling streak" value={`${data.streaks.journaling}d`} />
        <Stat
          label="Plan-adherence streak"
          value={`${data.streaks.planAdherence}d`}
        />
        <Stat
          label="Zero-violation streak"
          value={`${data.streaks.zeroViolation}d`}
        />
        <Stat label="Clean-setup streak" value={`${data.streaks.cleanSetup}d`} />
      </div>

      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Discipline score
        </h2>
        <p className="mb-4 text-3xl font-semibold text-foreground">
          {data.avgDisciplineScore != null
            ? Math.round(data.avgDisciplineScore)
            : "—"}
          <span className="ml-2 text-sm font-normal text-muted">
            avg, last 30 trading days
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {data.disciplineHistory.map((d) => (
            <div
              key={d.date}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface-raised px-2 py-1.5"
              title={d.date}
            >
              <span className="text-[10px] text-muted">
                {d.date.slice(5)}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {d.score != null ? Math.round(d.score) : "—"}
              </span>
            </div>
          ))}
          {data.disciplineHistory.length === 0 && (
            <p className="text-sm text-muted">No days logged yet.</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Tilt signals
        </h2>
        {data.tiltSignals.length === 0 ? (
          <p className="text-sm text-muted">
            None detected in the last 30 trading days.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.tiltSignals.map((signal, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-loss/30 bg-loss-muted px-4 py-2 text-sm"
              >
                <span className="font-medium text-loss">
                  {TILT_LABELS[signal.type]}
                </span>
                <span className="text-muted">{signal.detail}</span>
                <span className="text-xs text-muted">{signal.date}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            $ goals
          </h2>
          <form
            action={createGoalAction}
            className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tier">
                <Select name="tier" defaultValue="weekly">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </Field>
              <Field label="Target amount ($)">
                <TextInput
                  name="targetAmount"
                  type="number"
                  step="any"
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Period start">
                <TextInput name="periodStart" type="date" required />
              </Field>
              <Field label="Period end">
                <TextInput name="periodEnd" type="date" required />
              </Field>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Add $ goal
            </button>
          </form>
          <div className="flex flex-col gap-3">
            {data.dollarGoals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium capitalize text-foreground">
                    {goal.tier} · {formatCurrency(goal.targetAmount)}
                  </span>
                  <form action={deleteGoalAction}>
                    <input type="hidden" name="id" value={goal.id} />
                    <button
                      type="submit"
                      className="text-xs text-loss hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </div>
                <ProgressBar progress={goal.progress} />
                <p className="mt-1 text-xs text-muted">
                  {formatCurrency(goal.actual)} of{" "}
                  {formatCurrency(goal.targetAmount)} (
                  {goal.progress.toFixed(0)}%)
                </p>
              </div>
            ))}
            {data.dollarGoals.length === 0 && (
              <p className="text-sm text-muted">No $ goals set yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Process goals
          </h2>
          <form
            action={createProcessGoalAction}
            className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <Field label="Label">
              <TextInput
                name="label"
                required
                placeholder="Journal every trading day this month"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Metric">
                <Select name="metric" defaultValue="journaling_days">
                  <option value="journaling_days">Journaling days</option>
                  <option value="zero_violation_days">
                    Zero-violation days
                  </option>
                  <option value="clean_setup_days">Clean-setup days</option>
                  <option value="discipline_score">
                    Avg discipline score
                  </option>
                </Select>
              </Field>
              <Field label="Target value">
                <TextInput
                  name="targetValue"
                  type="number"
                  step="any"
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Period start">
                <TextInput name="periodStart" type="date" required />
              </Field>
              <Field label="Period end">
                <TextInput name="periodEnd" type="date" required />
              </Field>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Add process goal
            </button>
          </form>
          <div className="flex flex-col gap-3">
            {data.processGoalResults.map((goal) => (
              <div
                key={goal.id}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {goal.label}
                  </span>
                  <form action={deleteProcessGoalAction}>
                    <input type="hidden" name="id" value={goal.id} />
                    <button
                      type="submit"
                      className="text-xs text-loss hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </div>
                <ProgressBar progress={goal.progress} />
                <p className="mt-1 text-xs text-muted">
                  {goal.actual.toFixed(1)} of {goal.targetValue} (
                  {goal.progress.toFixed(0)}%)
                </p>
              </div>
            ))}
            {data.processGoalResults.length === 0 && (
              <p className="text-sm text-muted">No process goals set yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

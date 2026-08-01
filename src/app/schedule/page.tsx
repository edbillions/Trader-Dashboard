import { PageHeader } from "@/components/layout/page-header";
import { getScheduleData, listAllHabits } from "@/lib/data/schedule";
import { PRIORITIES } from "@/lib/schedule-data";
import { HabitChecklist } from "@/components/schedule/habit-checklist";
import { HabitHistoryGrid } from "@/components/schedule/habit-history-grid";
import { ScheduleTimeline } from "@/components/schedule/schedule-timeline";
import { FitnessSplitTable } from "@/components/schedule/fitness-split-table";
import { ManageHabitsSection } from "@/components/schedule/manage-habits-section";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const [{ habits }, allHabits] = await Promise.all([
    getScheduleData(),
    listAllHabits(),
  ]);

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Your daily routine, habit tracker, and training split — all in one place."
      />

      <div className="relative mb-8 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/20 via-surface to-surface px-8 py-8 shadow-[0_0_60px_-15px_var(--accent)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent">
          What this all protects
        </p>
        <ol className="flex flex-col gap-1.5">
          {PRIORITIES.map((p, i) => (
            <li key={p} className="text-sm text-foreground">
              <span className="font-semibold text-accent">{i + 1}.</span> {p}
            </li>
          ))}
        </ol>
      </div>

      <HabitChecklist habits={habits} />
      <HabitHistoryGrid habits={habits} />
      <ScheduleTimeline />
      <FitnessSplitTable />
      <ManageHabitsSection habits={allHabits} />
    </div>
  );
}

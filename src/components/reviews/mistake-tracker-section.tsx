import type { GroupStat } from "@/lib/data/analytics";
import { GroupStatList } from "@/components/reviews/group-stat-list";
import { Field, TextArea } from "@/components/ui/field";
import { DatalistInput } from "@/components/ui/datalist-input";

export function MistakeTrackerSection({
  breakdown,
  defaultCostliestLabel,
  defaultNarrative,
}: {
  breakdown: GroupStat[];
  defaultCostliestLabel: string | null;
  defaultNarrative: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Mistake Tracker</h2>
      <GroupStatList stats={breakdown} emptyLabel="No mistakes tagged in this period." />
      <div className="mt-4 flex flex-col gap-3">
        <Field label="Costliest mistake">
          <DatalistInput
            name="mistakeTracker.costliestMistakeLabel"
            options={breakdown.map((b) => b.label)}
            defaultValue={defaultCostliestLabel ?? breakdown[0]?.label ?? ""}
          />
        </Field>
        <Field label="Narrative">
          <TextArea
            name="mistakeTracker.narrative"
            defaultValue={defaultNarrative ?? ""}
            placeholder="Which mistake cost the most, and what's the pattern behind it?"
          />
        </Field>
      </div>
    </div>
  );
}

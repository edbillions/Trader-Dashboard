import type { GroupStat } from "@/lib/data/analytics";
import { GroupStatList } from "@/components/reviews/group-stat-list";
import { Field, TextArea } from "@/components/ui/field";

function Breakdown({ title, stats }: { title: string; stats: GroupStat[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium text-muted">{title}</h3>
      <GroupStatList stats={stats} emptyLabel="Not enough data." />
    </div>
  );
}

export function PatternRecognitionSection({
  byDayOfWeek,
  bySymbol,
  byDirection,
  bySession,
  bySetupGrade,
  defaultNarrative,
}: {
  byDayOfWeek: GroupStat[];
  bySymbol: GroupStat[];
  byDirection: GroupStat[];
  bySession: GroupStat[];
  bySetupGrade: GroupStat[];
  defaultNarrative: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Pattern Recognition</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Breakdown title="By day of week" stats={byDayOfWeek} />
        <Breakdown title="By symbol" stats={bySymbol} />
        <Breakdown title="By direction" stats={byDirection} />
        <Breakdown title="By session" stats={bySession} />
        <Breakdown title="By setup grade" stats={bySetupGrade} />
      </div>
      <Field label="Narrative" className="mt-4">
        <TextArea
          name="patternRecognition.narrative"
          defaultValue={defaultNarrative ?? ""}
          placeholder="Best/worst day, instrument, direction, session, setup — what stands out?"
        />
      </Field>
    </div>
  );
}

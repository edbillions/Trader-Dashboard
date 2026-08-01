import { Field, TextArea } from "@/components/ui/field";

export function RuleViolationsSection({
  breakdown,
  defaultNarrative,
}: {
  breakdown: { label: string; count: number }[];
  defaultNarrative: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Rule Violations</h2>
      {breakdown.length === 0 ? (
        <p className="text-xs text-muted">No rule violations flagged in this period.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {breakdown.map((v) => (
            <span
              key={v.label}
              className="rounded-full border border-loss/30 bg-loss-muted px-2.5 py-1 text-xs font-medium text-loss"
            >
              {v.label} · {v.count}
            </span>
          ))}
        </div>
      )}
      <Field label="Narrative" className="mt-4">
        <TextArea
          name="ruleViolationsSummary.narrative"
          defaultValue={defaultNarrative ?? ""}
          placeholder="Which rule was broken most, and what does that suggest?"
        />
      </Field>
    </div>
  );
}

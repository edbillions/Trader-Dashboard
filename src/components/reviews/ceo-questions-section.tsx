import { Field, TextArea } from "@/components/ui/field";
import type { CeoQuestions } from "@/lib/types/review-sections";

const QUESTIONS: { key: keyof CeoQuestions; label: string }[] = [
  { key: "mostProfit", label: "What generated the most profit?" },
  { key: "mostCost", label: "What cost the most money?" },
  { key: "repeatingPattern", label: "What pattern keeps repeating?" },
  { key: "oneHabit", label: "What single habit would improve next period?" },
  { key: "satisfiedIfIdentical", label: "If next period looked identical, would I be satisfied?" },
];

export function CeoQuestionsSection({ defaultValues }: { defaultValues: CeoQuestions }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Weekly CEO Meeting Questions</h2>
      <div className="flex flex-col gap-3">
        {QUESTIONS.map((q) => (
          <Field key={q.key} label={q.label}>
            <TextArea
              name={`ceoQuestions.${q.key}`}
              defaultValue={defaultValues[q.key] ?? ""}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

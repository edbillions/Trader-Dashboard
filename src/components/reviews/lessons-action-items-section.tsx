import { Field, TextInput } from "@/components/ui/field";

function ThreeInputs({ prefix, defaults }: { prefix: string; defaults: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <TextInput key={i} name={`${prefix}.${i}`} defaultValue={defaults[i] ?? ""} />
      ))}
    </div>
  );
}

export function LessonsAndActionItemsSection({
  defaultLessons,
  defaultActionItems,
}: {
  defaultLessons: string[];
  defaultActionItems: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Lessons Learned &amp; Action Items
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Three lessons learned">
          <ThreeInputs prefix="lessonsLearned" defaults={defaultLessons} />
        </Field>
        <Field label="Three action items for next period">
          <ThreeInputs prefix="actionItems" defaults={defaultActionItems} />
        </Field>
      </div>
    </div>
  );
}

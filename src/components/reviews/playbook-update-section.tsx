import { Field, TextArea } from "@/components/ui/field";

export function PlaybookUpdateSection({ defaultNotes }: { defaultNotes: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Playbook Update</h2>
      <Field label="Add only proven observations">
        <TextArea
          name="playbookUpdate.notes"
          defaultValue={defaultNotes ?? ""}
          placeholder="What did this period prove that's worth adding to the playbook?"
        />
      </Field>
    </div>
  );
}

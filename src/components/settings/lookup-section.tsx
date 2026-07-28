import { Field, TextInput } from "@/components/ui/field";

interface LookupItem {
  id: string;
  label: string;
  active: boolean;
}

export function LookupSection({
  title,
  items,
  createAction,
  toggleAction,
}: {
  title: string;
  items: LookupItem[];
  createAction: (formData: FormData) => void | Promise<void>;
  toggleAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <form action={createAction} className="mb-3 flex gap-2">
        <Field label="" className="flex-1">
          <TextInput name="label" placeholder="Add new..." required />
        </Field>
        <button
          type="submit"
          className="h-fit self-end rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-raised"
        >
          Add
        </button>
      </form>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <form
            key={item.id}
            action={toggleAction}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-raised"
          >
            <input type="hidden" name="id" value={item.id} />
            <input
              type="hidden"
              name="active"
              value={(!item.active).toString()}
            />
            <span
              className={
                item.active
                  ? "text-sm text-foreground"
                  : "text-sm text-muted line-through"
              }
            >
              {item.label}
            </span>
            <button
              type="submit"
              className="text-xs font-medium text-accent hover:underline"
            >
              {item.active ? "Deactivate" : "Activate"}
            </button>
          </form>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted">Nothing added yet.</p>
        )}
      </div>
    </div>
  );
}

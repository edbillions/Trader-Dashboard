import { clsx } from "clsx";
import { Field, TextInput, Select } from "@/components/ui/field";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import {
  createHabitAction,
  toggleHabitActiveAction,
  deleteHabitAction,
} from "@/lib/actions/habits";

interface HabitRow {
  id: string;
  label: string;
  cadence: string;
  active: boolean;
}

export function ManageHabitsSection({ habits }: { habits: HabitRow[] }) {
  return (
    <details className="mb-8 rounded-xl border border-border bg-surface p-5">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Manage habits
      </summary>

      <form
        action={createHabitAction}
        className="mb-4 mt-4 flex gap-2 border-b border-border pb-4"
      >
        <Field label="" className="flex-1">
          <TextInput name="label" placeholder="New habit..." required />
        </Field>
        <Field label="">
          <Select name="cadence" defaultValue="daily">
            <option value="daily">Every day</option>
            <option value="weekday">Weekdays only</option>
          </Select>
        </Field>
        <button
          type="submit"
          className="h-fit self-end rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-raised"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col gap-1">
        {habits.map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-raised"
          >
            <span
              className={clsx(
                "text-sm",
                h.active ? "text-foreground" : "text-muted line-through",
              )}
            >
              {h.label}{" "}
              <span className="text-xs text-muted">
                ({h.cadence === "weekday" ? "weekdays" : "every day"})
              </span>
            </span>
            <div className="flex items-center gap-3">
              <form action={toggleHabitActiveAction}>
                <input type="hidden" name="id" value={h.id} />
                <input
                  type="hidden"
                  name="active"
                  value={(!h.active).toString()}
                />
                <button
                  type="submit"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  {h.active ? "Deactivate" : "Activate"}
                </button>
              </form>
              <form action={deleteHabitAction}>
                <input type="hidden" name="id" value={h.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Delete "${h.label}"? This also deletes its full completion history and can't be undone.`}
                  className="text-xs font-medium text-loss hover:underline"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))}
        {habits.length === 0 && (
          <p className="text-sm text-muted">No habits yet.</p>
        )}
      </div>
    </details>
  );
}

import { clsx } from "clsx";
import { Field, TextInput, Select } from "@/components/ui/field";
import {
  createTagCategoryAction,
  createTagOptionAction,
  toggleTagCategoryActiveAction,
  toggleTagOptionActiveAction,
} from "@/lib/actions/settings";

interface TagOptionRow {
  id: string;
  label: string;
  sentiment: string;
  active: boolean;
}

interface TagCategoryRow {
  id: string;
  name: string;
  active: boolean;
  tags: TagOptionRow[];
}

const SENTIMENT_CLASS: Record<string, string> = {
  positive: "text-profit",
  negative: "text-loss",
  neutral: "text-accent",
};

export function TagCategoryManager({
  categories,
}: {
  categories: TagCategoryRow[];
}) {
  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-semibold text-foreground">
        Trade tags
      </h2>
      <p className="mb-4 text-xs text-muted">
        Entry/exit/management and psychology tags used in the journal form
        and tracked on Analytics. Grouped into categories — add your own
        categories and tags below.
      </p>

      <form
        action={createTagCategoryAction}
        className="mb-4 flex gap-2 border-b border-border pb-4"
      >
        <Field label="" className="flex-1">
          <TextInput name="name" placeholder="New tag category..." required />
        </Field>
        <button
          type="submit"
          className="h-fit self-end rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-raised"
        >
          Add category
        </button>
      </form>

      <div className="flex flex-col gap-5">
        {categories.map((category) => (
          <div key={category.id}>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={clsx(
                  "text-sm font-semibold",
                  category.active
                    ? "text-foreground"
                    : "text-muted line-through",
                )}
              >
                {category.name}
              </span>
              <form action={toggleTagCategoryActiveAction}>
                <input type="hidden" name="id" value={category.id} />
                <input
                  type="hidden"
                  name="active"
                  value={(!category.active).toString()}
                />
                <button
                  type="submit"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  {category.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>

            <form
              action={createTagOptionAction}
              className="mb-2 flex gap-2"
            >
              <input type="hidden" name="categoryId" value={category.id} />
              <Field label="" className="flex-1">
                <TextInput name="label" placeholder="New tag..." required />
              </Field>
              <Field label="">
                <Select name="sentiment" defaultValue="neutral">
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
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
              {category.tags.map((tag) => (
                <form
                  key={tag.id}
                  action={toggleTagOptionActiveAction}
                  className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-surface-raised"
                >
                  <input type="hidden" name="id" value={tag.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={(!tag.active).toString()}
                  />
                  <span
                    className={clsx(
                      "text-sm",
                      tag.active
                        ? SENTIMENT_CLASS[tag.sentiment]
                        : "text-muted line-through",
                    )}
                  >
                    {tag.label}
                  </span>
                  <button
                    type="submit"
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {tag.active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              ))}
              {category.tags.length === 0 && (
                <p className="px-2 text-xs text-muted">No tags yet.</p>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted">No tag categories yet.</p>
        )}
      </div>
    </section>
  );
}

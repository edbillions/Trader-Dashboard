import { PageHeader } from "@/components/layout/page-header";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { DatalistInput } from "@/components/ui/datalist-input";
import { PeriodTypeSelector } from "@/components/reviews/period-type-selector";
import { createReviewAction } from "@/lib/actions/reviews";

export const dynamic = "force-dynamic";

const CATEGORY_SUGGESTIONS = ["Discipline", "Performance", "Psychology"];

export default function NewReviewPage() {
  return (
    <div>
      <PageHeader
        title="New review"
        description="Winners, losers, win rate, and net are computed live from trades in the period."
      />

      <form
        action={createReviewAction}
        className="flex max-w-2xl flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <Field label="Title">
          <TextInput name="title" required placeholder="Week of..." />
        </Field>

        <PeriodTypeSelector />

        <Field label="Category (optional)">
          <DatalistInput name="category" options={CATEGORY_SUGGESTIONS} />
        </Field>

        <Field label="Rating (1-5, optional)">
          <TextInput name="rating" type="number" min={1} max={5} step={1} />
        </Field>

        <Field label="Notes">
          <TextArea
            name="notes"
            placeholder="What went well, what to fix, what to focus on next period..."
          />
        </Field>

        <button
          type="submit"
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Save review
        </button>
      </form>
    </div>
  );
}

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { DatalistInput } from "@/components/ui/datalist-input";
import { PeriodTypeSelector } from "@/components/reviews/period-type-selector";
import { Gauge } from "@/components/ui/gauge";
import { getReviewDetail } from "@/lib/data/reviews";
import { updateReviewAction, deleteReviewAction } from "@/lib/actions/reviews";
import { formatCurrency, formatR } from "@/lib/pnl";

export const dynamic = "force-dynamic";

const CATEGORY_SUGGESTIONS = [
  "Week",
  "Month",
  "Quarter",
  "Year",
  "Discipline",
  "Performance",
  "Psychology",
];

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReviewDetail(id);
  if (!review) notFound();

  return (
    <div>
      <PageHeader
        title={review.title}
        description={
          review.isDraft
            ? "Draft — needs your review. Saving clears the draft flag."
            : "Winners, losers, win rate, and net are computed live from trades in the period."
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Trades"
          value={`${review.stats.tradeCount} (${review.stats.winners}W / ${review.stats.losers}L)`}
        />
        <Stat
          label="Win rate"
          value={review.stats.winRate != null ? `${review.stats.winRate.toFixed(0)}%` : "—"}
        />
        <Stat
          label="Net"
          value={`${formatCurrency(review.stats.netPnl)} · ${formatR(review.stats.netR)}`}
          positive={review.stats.netPnl >= 0}
        />
        <div className="rounded-xl border border-border bg-surface p-4">
          <Gauge
            label="Tiltmeter"
            usedLabel={`${review.tiltmeter.signalCount} signals`}
            limitLabel={`${review.tiltmeter.daysWithTrades} trading day${review.tiltmeter.daysWithTrades === 1 ? "" : "s"}`}
            pct={review.tiltmeter.pct}
          />
        </div>
      </div>

      <form
        action={updateReviewAction}
        className="flex max-w-2xl flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <input type="hidden" name="id" value={review.id} />

        <Field label="Title">
          <TextInput name="title" defaultValue={review.title} required />
        </Field>

        <PeriodTypeSelector
          initialStart={toDateInputValue(review.periodStart)}
          initialEnd={toDateInputValue(review.periodEnd)}
        />

        <Field label="Category (optional)">
          <DatalistInput
            name="category"
            options={CATEGORY_SUGGESTIONS}
            defaultValue={review.category ?? ""}
          />
        </Field>

        <Field label="Rating (1-5, optional)">
          <TextInput
            name="rating"
            type="number"
            min={1}
            max={5}
            step={1}
            defaultValue={review.rating ?? ""}
          />
        </Field>

        <Field label="Notes">
          <TextArea
            name="notes"
            defaultValue={review.notes ?? ""}
            placeholder="What went well, what to fix, what to focus on next period..."
          />
        </Field>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Save review
          </button>
          <button
            formAction={deleteReviewAction}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-loss hover:bg-surface-raised"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={
          positive === undefined
            ? "mt-1 text-lg font-semibold text-foreground"
            : positive
              ? "mt-1 text-lg font-semibold text-profit"
              : "mt-1 text-lg font-semibold text-loss"
        }
      >
        {value}
      </p>
    </div>
  );
}

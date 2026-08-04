import type { BehaviorReview } from "@/lib/domain/behavior-review";

export function BehaviorReviewLists({ review }: { review: BehaviorReview }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Behavior Review</h3>
      <p className="mb-3 text-xs text-muted">
        The Discipline Score is the sum of these behaviors — not your P&amp;L.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-profit">
            What Helped
          </p>
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {review.whatHelped.map((item, i) => (
              <li key={i}>✓ {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-yellow-500">
            Watch Tomorrow
          </p>
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {review.watchTomorrow.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

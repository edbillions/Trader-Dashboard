import { computeCoachReview, type CoachReviewTradeInput } from "@/lib/domain/coach-review";

const CARDS: { key: keyof ReturnType<typeof computeCoachReview>; title: string }[] = [
  { key: "quickRead", title: "Quick Read" },
  { key: "whatMattered", title: "What Mattered" },
  { key: "mainImprovement", title: "Main Improvement" },
  { key: "nextTradeRule", title: "Next Trade Rule" },
];

export function CoachReviewPanel({ trade }: { trade: CoachReviewTradeInput }) {
  const review = computeCoachReview(trade);

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Rule-based summary
      </p>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Coach Review</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className="rounded-lg border border-border/60 bg-surface-raised p-4"
          >
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              {card.title}
            </h3>
            <p className="text-sm text-foreground">{review[card.key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

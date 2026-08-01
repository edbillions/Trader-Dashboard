import { Field, TextArea } from "@/components/ui/field";

interface MissedTradeLike {
  id: string;
  symbol: string;
  setupDescription: string | null;
  reasonMissed: string | null;
  estimatedRMultiple: number | null;
}

export function OpportunityReviewSection({
  missedTrades,
  defaultNarrative,
}: {
  missedTrades: MissedTradeLike[];
  defaultNarrative: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Opportunity Review</h2>
      {missedTrades.length === 0 ? (
        <p className="text-xs text-muted">No missed A+ setups logged this week.</p>
      ) : (
        <div className="flex flex-col gap-2 text-xs">
          {missedTrades.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-border bg-surface-raised p-2.5"
            >
              <p className="font-medium text-foreground">{m.symbol}</p>
              <p className="text-muted">{m.setupDescription ?? "—"}</p>
              <p className="text-muted">Missed because: {m.reasonMissed ?? "—"}</p>
              {m.estimatedRMultiple != null && (
                <p className="text-muted">Est. {m.estimatedRMultiple}R</p>
              )}
            </div>
          ))}
        </div>
      )}
      <Field label="Narrative" className="mt-4">
        <TextArea
          name="opportunityReview.narrative"
          defaultValue={defaultNarrative ?? ""}
          placeholder="What A+ setups did I miss, and why?"
        />
      </Field>
    </div>
  );
}

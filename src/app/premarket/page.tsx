import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { InstrumentAnalysisCard } from "@/components/premarket/instrument-analysis-card";
import { RunPreMarketAnalysisButton } from "@/components/premarket/run-analysis-button";
import { RunDailyReviewButton } from "@/components/premarket/run-review-button";
import { getTodayPreMarketState, listPreMarketDays } from "@/lib/data/premarket";

export const dynamic = "force-dynamic";

export default async function PreMarketPage() {
  const [today, history] = await Promise.all([
    getTodayPreMarketState(),
    listPreMarketDays(),
  ]);

  const hasUnreviewedAnalysis = today.analyses.some((a) => a.review == null);

  return (
    <div>
      <PageHeader
        title="Pre-Market Analyst"
        description="ICT Unicorn Model checklist for NQ, run on demand each morning."
        actions={
          <Link href="/premarket/learning" className="text-sm text-accent hover:underline">
            Learning System →
          </Link>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <RunPreMarketAnalysisButton />
        {today.analyses.length > 0 && hasUnreviewedAnalysis && <RunDailyReviewButton />}
      </div>

      {today.analyses.length === 0 ? (
        <div className="mb-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No analysis run yet today. Click &quot;Run Pre-Market Analysis&quot; above to
          capture your TradingView charts and get today&apos;s bias and trade plan for NQ.
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4">
          {today.analyses.map((analysis) => (
            <InstrumentAnalysisCard key={analysis.id} analysis={analysis} showActions />
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">History</h2>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Nothing logged yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">NQ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((day) => {
                  const nq = day.instruments.find((i) => i.instrument === "NQ");
                  return (
                    <tr key={day.date} className="border-t border-border hover:bg-surface">
                      <td className="px-4 py-3">
                        <Link
                          href={`/premarket/${day.date}`}
                          className="font-medium text-foreground hover:text-accent"
                        >
                          {day.date}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <InstrumentSummaryCell row={nq} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function InstrumentSummaryCell({
  row,
}: {
  row:
    | {
        overallBias: string;
        tradeable: boolean;
        confidence: number;
        accuracyScore: number | null;
      }
    | undefined;
}) {
  if (!row) return <span>—</span>;
  return (
    <span>
      {row.tradeable ? row.overallBias : "no trade"} ({Math.round(row.confidence)}%)
      {row.accuracyScore != null && (
        <span className="ml-2 text-accent">{Math.round(row.accuracyScore)}/100</span>
      )}
    </span>
  );
}

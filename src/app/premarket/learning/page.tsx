import { PageHeader } from "@/components/layout/page-header";
import { LearningTrendChart } from "@/components/premarket/learning-trend-chart";
import { getLearningSystemStats } from "@/lib/data/premarket";
import type { LearningSystemDimension } from "@/lib/domain/premarket";

export const dynamic = "force-dynamic";

export default async function PreMarketLearningPage() {
  const stats = await getLearningSystemStats();

  const instruments = stats.perInstrument.map((s) => s.instrument);
  const trendByDate = new Map<string, Record<string, string | number>>();
  for (const row of stats.trend) {
    const existing = trendByDate.get(row.date) ?? { date: row.date };
    existing[row.instrument] = row.overallAccuracyScore;
    trendByDate.set(row.date, existing);
  }
  const chartData = Array.from(trendByDate.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );

  return (
    <div>
      <PageHeader
        title="Learning System"
        description={`Rolling ${stats.windowDays}-day prediction accuracy, tracked across five ICT Unicorn Model dimensions per instrument.`}
      />

      {stats.perInstrument.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No graded days yet. Run a Daily Review after a Pre-Market Analysis to start building
          accuracy history.
        </div>
      ) : (
        <>
          <div className="mb-8 rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Overall accuracy trend</h2>
            <LearningTrendChart data={chartData} instruments={instruments} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {stats.perInstrument.map((s) => (
              <div key={s.instrument} className="rounded-xl border border-border bg-surface p-5">
                <h2 className="mb-4 text-lg font-semibold text-foreground">{s.instrument}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <DimensionStat dimension={s.bias} />
                  <DimensionStat dimension={s.liquidity} />
                  <DimensionStat dimension={s.fvg} />
                  <DimensionStat dimension={s.target} />
                  <DimensionStat dimension={s.narrative} />
                  <DimensionStat dimension={s.overall} highlight />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DimensionStat({
  dimension,
  highlight,
}: {
  dimension: LearningSystemDimension;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border border-accent/30 bg-accent/5 p-3"
          : "rounded-lg border border-border bg-surface-raised p-3"
      }
    >
      <p className="text-xs font-medium text-muted">{dimension.label}</p>
      <p className={highlight ? "mt-0.5 text-lg font-semibold text-accent" : "mt-0.5 text-lg font-semibold text-foreground"}>
        {dimension.avgScore != null ? `${dimension.avgScore}/100` : "—"}
      </p>
      <p className="mt-0.5 text-[11px] text-muted">
        {dimension.sampleSize} {dimension.sampleSize === 1 ? "day" : "days"}
      </p>
    </div>
  );
}

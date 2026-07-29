import { PageHeader } from "@/components/layout/page-header";
import { getAnalyticsData } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/pnl";
import { CompositeRadar } from "@/components/analytics/composite-radar";
import { NetPnlBarChart } from "@/components/analytics/net-pnl-bar-chart";
import { BreakdownTable } from "@/components/analytics/breakdown-table";
import { PatternInsights } from "@/components/analytics/pattern-insights";
import { SetupGradeCards } from "@/components/analytics/setup-grade-cards";
import { ConfluenceLeaderboard } from "@/components/analytics/confluence-leaderboard";
import { ExcursionCard } from "@/components/analytics/excursion-card";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  const { totals, composite, breakdowns, excursion } = data;

  const rankedSessions = [...breakdowns.bySession].sort(
    (a, b) => b.netPnl - a.netPnl,
  );
  const bestSession = rankedSessions[0] ?? null;
  const worstSession =
    rankedSessions.length > 1 ? rankedSessions[rankedSessions.length - 1] : null;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description={`${totals.tradeCount} trade${totals.tradeCount === 1 ? "" : "s"} analyzed.`}
      />

      <PatternInsights />

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-1">
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Composite score
          </h3>
          <p className="mb-2 text-3xl font-semibold text-foreground">
            {composite.overall != null ? Math.round(composite.overall) : "—"}
          </p>
          <CompositeRadar breakdown={composite.breakdown} />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <Stat label="Win rate" value={fmtPct(totals.winRate)} />
          <Stat
            label="Profit factor"
            value={totals.profitFactor != null ? totals.profitFactor.toFixed(2) : "—"}
          />
          <Stat
            label="Avg win / avg loss"
            value={formatCurrency(totals.avgWin) + " / " + formatCurrency(totals.avgLoss)}
          />
          <Stat
            label="Discipline score"
            value={
              totals.disciplineScore != null
                ? Math.round(totals.disciplineScore).toString()
                : "—"
            }
          />
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Killzone performance
          </h3>
          <div className="flex items-center gap-4 text-xs">
            {bestSession && (
              <span className="text-muted">
                Best:{" "}
                <span className="font-medium text-profit">
                  {bestSession.label}
                </span>
              </span>
            )}
            {worstSession && (
              <span className="text-muted">
                Worst:{" "}
                <span className="font-medium text-loss">
                  {worstSession.label}
                </span>
              </span>
            )}
          </div>
        </div>
        <NetPnlBarChart stats={breakdowns.bySession} />
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Excursion analysis (MFE / MAE)
          </h3>
          <ExcursionCard excursion={excursion} />
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Confluence factor win rate
          </h3>
          <ConfluenceLeaderboard stats={breakdowns.byConfluenceFactor} />
        </section>
      </div>

      <section className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Setup grade quality
        </h3>
        <SetupGradeCards stats={breakdowns.bySetupGrade} />
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakdownTable title="By day of week" stats={breakdowns.byDayOfWeek} />
        <BreakdownTable title="By hour" stats={breakdowns.byHour} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakdownTable title="By symbol" stats={breakdowns.bySymbol} />
        <BreakdownTable title="News day vs. no news" stats={breakdowns.byNewsDay} />
        <BreakdownTable title="By entry timeframe" stats={breakdowns.byTimeframe} />
        <BreakdownTable title="By entry model" stats={breakdowns.byEntryModel} />
      </div>
    </div>
  );
}

function fmtPct(value: number | null) {
  return value != null ? `${value.toFixed(1)}%` : "—";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

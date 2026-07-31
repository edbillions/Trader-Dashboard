import { PageHeader } from "@/components/layout/page-header";
import { getAnalyticsData } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/pnl";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CompositeRadar } from "@/components/analytics/composite-radar";
import { NetPnlBarChart } from "@/components/analytics/net-pnl-bar-chart";
import { BreakdownTable } from "@/components/analytics/breakdown-table";
import { PatternInsights } from "@/components/analytics/pattern-insights";
import { SetupGradeCards } from "@/components/analytics/setup-grade-cards";
import { ConfluenceLeaderboard } from "@/components/analytics/confluence-leaderboard";
import { ExcursionCard } from "@/components/analytics/excursion-card";
import { TradeStatsPanel } from "@/components/analytics/trade-stats-panel";
import { HourlyBreakdownChart } from "@/components/analytics/hourly-breakdown-chart";
import { ManagementSection } from "@/components/analytics/management-section";
import { TrueSystemEdgeCard } from "@/components/analytics/true-system-edge-card";
import { OutlierTradesList } from "@/components/analytics/outlier-trades-list";
import { AnalyticsFilterBar } from "@/components/analytics/analytics-filter-bar";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ accountType?: string }>;
}) {
  const { accountType } = await searchParams;
  const data = await getAnalyticsData({ accountType });
  const {
    totals,
    composite,
    breakdowns,
    excursion,
    stats,
    monthlyPnl,
    management,
    systemEdge,
    outlierTrades,
  } = data;

  const rankedSessions = [...breakdowns.bySession].sort(
    (a, b) => b.netPnl - a.netPnl,
  );
  const bestSession = rankedSessions[0] ?? null;
  const worstSession =
    rankedSessions.length > 1 ? rankedSessions[rankedSessions.length - 1] : null;

  // Forces every AnimatedNumber under this page to remount (and replay its
  // count-up) on every visit — a fresh key each time this force-dynamic page
  // is server-rendered, whether that's a hard reload or an in-app navigation
  // back to this route. Without it, React would reuse existing component
  // instances and skip the animation whenever the numbers happen to be
  // unchanged from the last visit.
  const pageLoadKey = Date.now();

  return (
    <div key={pageLoadKey}>
      <PageHeader
        title="Analytics"
        description={`${totals.tradeCount} trade${totals.tradeCount === 1 ? "" : "s"} analyzed.`}
      />

      <AnalyticsFilterBar />

      <PatternInsights />

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-1">
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Composite score
          </h3>
          <p className="mb-2 text-3xl font-semibold text-foreground">
            <AnimatedNumber value={composite.overall} format="integer" />
          </p>
          <CompositeRadar breakdown={composite.breakdown} />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <Stat
            label="Win rate"
            value={<AnimatedNumber value={totals.winRate} format="percent1" />}
          />
          <Stat
            label="Profit factor"
            value={<AnimatedNumber value={totals.profitFactor} format="fixed2" />}
          />
          <Stat
            label="Avg win / avg loss"
            value={
              <>
                <AnimatedNumber value={totals.avgWin} format="currency" />
                {" / "}
                <AnimatedNumber value={totals.avgLoss} format="currency" />
              </>
            }
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

      <TradeStatsPanel stats={stats} monthlyPnl={monthlyPnl} />

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

      <section className="mb-8 rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Trade management quality
        </h3>
        <ManagementSection management={management} />
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Setup grade quality
        </h3>
        <SetupGradeCards stats={breakdowns.bySetupGrade} />
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          True system edge
        </h3>
        <TrueSystemEdgeCard edge={systemEdge} />
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4">
          <OutlierTradesList
            title="Biggest wins"
            trades={outlierTrades.biggestWins}
            tone="profit"
          />
        </section>
        <section className="rounded-xl border border-border bg-surface p-4">
          <OutlierTradesList
            title="Biggest losses"
            trades={outlierTrades.biggestLosses}
            tone="loss"
          />
        </section>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownTable title="By day of week" stats={breakdowns.byDayOfWeek} />
        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            By hour
          </h3>
          <HourlyBreakdownChart stats={breakdowns.byHour} />
        </section>
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

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

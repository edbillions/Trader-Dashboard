import { PageHeader } from "@/components/layout/page-header";
import { getAnalyticsData } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/pnl";
import { CompositeRadar } from "@/components/analytics/composite-radar";
import { NetPnlBarChart } from "@/components/analytics/net-pnl-bar-chart";
import { BreakdownTable } from "@/components/analytics/breakdown-table";
import { PatternInsights } from "@/components/analytics/pattern-insights";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  const { totals, composite, breakdowns } = data;

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
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Net P&L by session
        </h3>
        <NetPnlBarChart stats={breakdowns.bySession} />
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakdownTable title="By day of week" stats={breakdowns.byDayOfWeek} />
        <BreakdownTable title="By hour" stats={breakdowns.byHour} />
        <BreakdownTable title="By symbol" stats={breakdowns.bySymbol} />
        <BreakdownTable title="News day vs. no news" stats={breakdowns.byNewsDay} />
        <BreakdownTable title="By entry timeframe" stats={breakdowns.byTimeframe} />
        <BreakdownTable title="By entry model" stats={breakdowns.byEntryModel} />
        <BreakdownTable title="By session/killzone" stats={breakdowns.bySession} />
        <BreakdownTable title="By setup grade" stats={breakdowns.bySetupGrade} />
        <BreakdownTable
          title="By confluence factor"
          stats={breakdowns.byConfluenceFactor}
        />
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

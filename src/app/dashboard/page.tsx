import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { getDashboardData } from "@/lib/data/dashboard";
import { getAnalyticsData } from "@/lib/data/analytics";
import { formatCurrency, formatR } from "@/lib/pnl";
import { CompositeRadar } from "@/components/analytics/composite-radar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, analytics] = await Promise.all([
    getDashboardData(),
    getAnalyticsData(),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your trading day, at a glance."
      />

      {!data.hasLoggedToday && (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Today&apos;s entry is incomplete
            </p>
            <p className="text-sm text-muted">
              You haven&apos;t logged {data.today} yet.
            </p>
          </div>
          <Link
            href="/journal/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Log today
          </Link>
        </div>
      )}

      {data.hasLoggedToday && data.todaySummary && (
        <section className="mb-8 rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Today
              </p>
              <h2 className="text-xl font-semibold text-foreground">
                {format(new Date(`${data.today}T00:00:00`), "EEEE, MMM d, yyyy")}
              </h2>
            </div>
            <Link
              href={`/journal/${data.today}`}
              className="text-sm text-accent hover:underline"
            >
              View day →
            </Link>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <MiniStat
              label="Trades taken"
              value={data.todaySummary.tradeCount.toString()}
            />
            <MiniStat
              label="Win rate today"
              value={
                data.todaySummary.winRate != null
                  ? `${data.todaySummary.winRate.toFixed(0)}%`
                  : "—"
              }
              sublabel={`${data.todaySummary.wins}W / ${data.todaySummary.losses}L`}
            />
            <MiniStat
              label="Net P&L today"
              value={formatCurrency(data.todaySummary.netPnl)}
              positive={data.todaySummary.netPnl >= 0}
            />
          </div>

          {data.todaySummary.takeaway && (
            <div className="mb-4 rounded-lg border border-border bg-surface-raised p-3">
              <p className="mb-1 text-xs font-medium text-muted">Takeaway</p>
              <p className="text-sm text-foreground">
                {data.todaySummary.takeaway}
              </p>
            </div>
          )}

          {data.todaySummary.trades.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted">
                Today&apos;s trades
              </p>
              <div className="flex flex-col gap-1.5">
                {data.todaySummary.trades.map((t) => (
                  <Link
                    key={t.id}
                    href={`/trades/${t.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm hover:bg-surface"
                  >
                    <span className="font-medium text-foreground">
                      {t.symbol}
                      {t.setupGrade && (
                        <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                          {t.setupGrade}
                        </span>
                      )}
                    </span>
                    <span
                      className={
                        (t.netPnl ?? 0) >= 0
                          ? "font-medium text-profit"
                          : "font-medium text-loss"
                      }
                    >
                      {formatCurrency(t.netPnl)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Total trades" value={data.totalTrades.toString()} />
        <Stat
          label="Net P&L (all-time)"
          value={formatCurrency(data.netPnl)}
          positive={data.netPnl >= 0}
        />
        <Stat
          label="Win rate"
          value={data.winRate != null ? `${data.winRate.toFixed(1)}%` : "—"}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-1">
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Composite score
          </h3>
          <p className="mb-2 text-3xl font-semibold text-foreground">
            {analytics.composite.overall != null
              ? Math.round(analytics.composite.overall)
              : "—"}
          </p>
          <CompositeRadar breakdown={analytics.composite.breakdown} />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <Stat label="Win rate" value={fmtPct(analytics.totals.winRate)} />
          <Stat
            label="Profit factor"
            value={
              analytics.totals.profitFactor != null
                ? analytics.totals.profitFactor.toFixed(2)
                : "—"
            }
          />
          <Stat
            label="Avg win / avg loss"
            value={
              formatCurrency(analytics.totals.avgWin) +
              " / " +
              formatCurrency(analytics.totals.avgLoss)
            }
          />
          <Stat
            label="Discipline score"
            value={
              analytics.totals.disciplineScore != null
                ? Math.round(analytics.totals.disciplineScore).toString()
                : "—"
            }
          />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Recent days
        </h2>
        {data.recentDays.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Nothing logged yet.{" "}
            <Link href="/journal/new" className="text-accent hover:underline">
              Log your first day
            </Link>
            .
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.recentDays.map((day) => (
              <Link
                key={day.date}
                href={`/journal/${day.date}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm hover:bg-surface-raised"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {day.date}
                  </span>
                  <span
                    className={
                      day.netPnl >= 0
                        ? "font-semibold text-profit"
                        : "font-semibold text-loss"
                    }
                  >
                    {formatCurrency(day.netPnl)}
                  </span>
                </div>
                {day.tradeCount === 0 ? (
                  <span className="text-xs text-muted">No trades logged</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span>
                      {day.tradeCount} trade{day.tradeCount === 1 ? "" : "s"}
                    </span>
                    <span>
                      {day.wins}W / {day.losses}L
                      {day.wins + day.losses > 0
                        ? ` (${((day.wins / (day.wins + day.losses)) * 100).toFixed(0)}%)`
                        : ""}
                    </span>
                    {day.totalR != null && <span>{formatR(day.totalR)} total</span>}
                    {day.symbols.length > 0 && (
                      <span>{day.symbols.join(", ")}</span>
                    )}
                    {day.planAdherenceGrade && (
                      <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-foreground">
                        Plan grade {day.planAdherenceGrade}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function fmtPct(value: number | null) {
  return value != null ? `${value.toFixed(1)}%` : "—";
}

function MiniStat({
  label,
  value,
  sublabel,
  positive,
}: {
  label: string;
  value: string;
  sublabel?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={
          positive === undefined
            ? "mt-0.5 text-lg font-semibold text-foreground"
            : positive
              ? "mt-0.5 text-lg font-semibold text-profit"
              : "mt-0.5 text-lg font-semibold text-loss"
        }
      >
        {value}
      </p>
      {sublabel && <p className="mt-0.5 text-xs text-muted">{sublabel}</p>}
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
            ? "mt-1 text-xl font-semibold text-foreground"
            : positive
              ? "mt-1 text-xl font-semibold text-profit"
              : "mt-1 text-xl font-semibold text-loss"
        }
      >
        {value}
      </p>
    </div>
  );
}

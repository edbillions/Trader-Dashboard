import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { getDashboardData } from "@/lib/data/dashboard";
import { getAnalyticsData } from "@/lib/data/analytics";
import { getAgentInsights } from "@/lib/data/agents";
import { getTodayMacroBriefing } from "@/lib/data/macro-briefing";
import { formatCurrency, formatR } from "@/lib/pnl";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CompositeRadar } from "@/components/analytics/composite-radar";
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { DashboardTodoWidget } from "@/components/dashboard/dashboard-todo-widget";
import { StreakCard } from "@/components/dashboard/streak-card";
import { TodayRiskWidget } from "@/components/dashboard/today-risk-widget";
import { AgentStatusStrip } from "@/components/agents/agent-status-strip";
import { MacroBriefingCard } from "@/components/dashboard/macro-briefing-card";
import { SessionClocks } from "@/components/layout/session-clocks";
import { quoteOfTheDay } from "@/lib/motivational-quotes";
import { getTodoWidgetItems } from "@/lib/data/todos";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, analytics, todayTodos, agents, macroBriefing] = await Promise.all([
    getDashboardData(),
    getAnalyticsData(),
    getTodoWidgetItems(),
    getAgentInsights(),
    getTodayMacroBriefing(),
  ]);

  const { tradeStreaks } = data;
  const isLossStreak = tradeStreaks.currentType === "loss";
  const winLossBest = isLossStreak
    ? tradeStreaks.bestLossStreak
    : tradeStreaks.bestWinStreak;

  // Forces every AnimatedNumber under this page to remount (and replay its
  // count-up) on every visit — a fresh key each time this force-dynamic page
  // is server-rendered, whether that's a hard reload or an in-app navigation
  // back to this route. Without it, React would reuse existing component
  // instances and skip the animation whenever the numbers happen to be
  // unchanged from the last visit.
  const pageLoadKey = Date.now();

  return (
    <div key={pageLoadKey}>
      <div className="mb-8 h-32 overflow-hidden rounded-2xl border border-border sm:h-40 md:h-48">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/dashboard-banner.jpg"
          alt="Eddie Billions — Family, Train, Trade, Real Estate, Repeat."
          className="h-full w-full object-cover object-top"
        />
      </div>

      <PageHeader
        title="Welcome Ed Billions!"
        description="Your trading day, at a glance."
      />

      <AgentStatusStrip
        insights={[agents.risk, agents.habit, agents.pattern, agents.sentiment]}
      />

      <div className="relative mb-8 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/20 via-surface to-surface px-8 py-12 text-center shadow-[0_0_60px_-15px_var(--accent)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Today&apos;s reminder
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
          &ldquo;{quoteOfTheDay()}&rdquo;
        </p>
      </div>

      <MacroBriefingCard initial={macroBriefing} />

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
        <section className="mb-8 rounded-xl border border-accent/20 bg-surface p-5 shadow-[0_0_24px_-8px_var(--accent)]">
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
              value={<AnimatedNumber value={data.todaySummary.tradeCount} format="integer" />}
            />
            <MiniStat
              label="Win rate today"
              value={<AnimatedNumber value={data.todaySummary.winRate} format="percent1" />}
              sublabel={`${data.todaySummary.wins}W / ${data.todaySummary.losses}L`}
            />
            <MiniStat
              label="Net P&L today"
              value={<AnimatedNumber value={data.todaySummary.netPnl} format="currency" />}
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

      <TodayRiskWidget risk={data.todayRisk} />

      <div className="mb-8 rounded-xl border border-border bg-surface p-6">
        <SessionClocks />
      </div>

      <DashboardTodoWidget todos={todayTodos} />

      <div className="mb-8 grid grid-cols-2 gap-4">
        <Stat
          label="Total trades"
          value={<AnimatedNumber value={data.totalTrades} format="integer" />}
        />
        <Stat
          label="Net P&L (all-time)"
          value={<AnimatedNumber value={data.netPnl} format="currency" />}
          positive={data.netPnl >= 0}
        />
      </div>

      <section className="mb-8 rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Equity curve
          </h3>
          <span
            className={
              data.netPnl >= 0
                ? "text-sm font-semibold text-profit"
                : "text-sm font-semibold text-loss"
            }
          >
            {formatCurrency(data.netPnl)} all-time
          </span>
        </div>
        {data.equityCurve.length > 1 ? (
          <EquityCurveChart data={data.equityCurve} />
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            Log a few more days to see your equity curve.
          </p>
        )}
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-1">
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Composite score
          </h3>
          <p className="mb-2 text-3xl font-semibold text-foreground">
            <AnimatedNumber value={analytics.composite.overall} format="integer" />
          </p>
          <CompositeRadar breakdown={analytics.composite.breakdown} />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <Stat
            label="Win rate"
            value={<AnimatedNumber value={analytics.totals.winRate} format="percent1" />}
          />
          <Stat
            label="Profit factor"
            value={<AnimatedNumber value={analytics.totals.profitFactor} format="fixed2" />}
          />
          <Stat
            label="Avg win / avg loss"
            value={
              <>
                <AnimatedNumber value={analytics.totals.avgWin} format="currency" />
                {" / "}
                <AnimatedNumber value={analytics.totals.avgLoss} format="currency" />
              </>
            }
          />
          <Stat
            label="Discipline score"
            value={<AnimatedNumber value={analytics.totals.disciplineScore} format="integer" />}
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StreakCard
          label="No rule breaks"
          icon="🛡️"
          count={data.noRuleBreakStreak}
          countLabel={
            data.noRuleBreakStreak === 1 ? "day clean" : "days clean"
          }
          caption="Consecutive trading days with zero rule violations."
          tone="accent"
        />
        <StreakCard
          label={isLossStreak ? "Loss streak" : "Win streak"}
          icon={isLossStreak ? "❄️" : "🔥"}
          count={tradeStreaks.currentCount}
          countLabel={
            tradeStreaks.currentType == null
              ? "no trades yet"
              : isLossStreak
                ? tradeStreaks.currentCount === 1
                  ? "loss in a row"
                  : "losses in a row"
                : tradeStreaks.currentCount === 1
                  ? "win in a row"
                  : "wins in a row"
          }
          caption={
            tradeStreaks.currentType == null
              ? "Log some trades to start tracking."
              : isLossStreak
                ? "Losses are part of the process — stay disciplined."
                : "Keep it going."
          }
          subtitle={
            tradeStreaks.currentType != null
              ? `best ${winLossBest} · avg ${tradeStreaks.avgStreakLength}`
              : undefined
          }
          tone={
            tradeStreaks.currentType == null
              ? "accent"
              : isLossStreak
                ? "loss"
                : "profit"
          }
        />
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
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
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

      <section className="mt-8 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-b from-surface via-surface to-accent/10 p-1 shadow-[0_0_60px_-20px_var(--accent)]">
        <div className="rounded-[14px] bg-surface/40 px-6 py-8 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            The vision
          </p>
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Why I show up every day
          </h2>
          <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-border shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dashboard-vision-board.jpg"
              alt="Ed's vision board — faith, family, discipline, and the $5,000,000 goal."
              className="w-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sublabel,
  positive,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-3 transition-colors hover:border-accent/40">
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
  value: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40">
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

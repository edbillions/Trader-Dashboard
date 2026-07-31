import Link from "next/link";
import { clsx } from "clsx";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getTradingDayDetail } from "@/lib/data/trading-day";
import { formatCurrency, formatR } from "@/lib/pnl";
import { quoteOfTheDay } from "@/lib/motivational-quotes";
import { DayPerformanceCard } from "@/components/journal/day-performance-card";
import {
  deleteTradingDayAction,
  deleteTradeAction,
  deleteMissedTradeAction,
  clearPreMarketPlanAction,
  clearPostSessionReviewAction,
} from "@/lib/actions/journal";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import {
  parsePreMarketChecklist,
  MINDSET_RESET_ITEMS,
  STRUCTURE_OPTIONS,
  DOL_OPTIONS,
} from "@/lib/types/premarket-checklist";
import {
  SCORECARD_CATEGORIES,
  SCORECARD_MAX_POINTS,
  parseScorecard,
  scorecardTotal,
  scorecardBand,
} from "@/lib/types/scorecard";

export default async function JournalDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const day = await getTradingDayDetail(date);

  if (!day) notFound();

  const netPnl = day.trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
  const checklist = parsePreMarketChecklist(day.preMarketChecklist);
  const structureLabel = (key: string | null) =>
    STRUCTURE_OPTIONS.find((o) => o.key === key)?.label ?? null;
  const yesNo = (v: boolean | null) => (v == null ? null : v ? "Yes" : "No");
  const scorecard = parseScorecard(day.scorecard);
  const scorecardTotalValue = scorecardTotal(scorecard);
  const scorecardBandValue = scorecardBand(scorecardTotalValue);
  const dailyQuote = quoteOfTheDay(new Date(`${date}T00:00:00`));

  return (
    <div>
      <PageHeader
        title={date}
        description={
          <span>
            <span className="font-semibold text-accent">
              {day.trades.length} trade{day.trades.length === 1 ? "" : "s"}
            </span>
            {" · Net P&L "}
            <span
              className={
                netPnl >= 0
                  ? "font-semibold text-profit"
                  : "font-semibold text-loss"
              }
            >
              {formatCurrency(netPnl)}
            </span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/journal/new?date=${date}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
            >
              Edit
            </Link>
            <form action={deleteTradingDayAction}>
              <input type="hidden" name="id" value={day.id} />
              <ConfirmSubmitButton
                confirmMessage={`Delete the entire journal entry for ${date}? This removes the pre-market plan, all trades, missed trades, and post-session review for this day. This can't be undone.`}
                className="rounded-lg border border-loss/40 px-4 py-2 text-sm font-medium text-loss hover:bg-loss-muted"
              >
                Delete day
              </ConfirmSubmitButton>
            </form>
          </div>
        }
      />

      <div
        className={clsx(
          "mb-6 flex items-center gap-3 rounded-xl border-2 px-4 py-3",
          day.planAdherenceGrade
            ? GRADE_BADGE_STYLES[day.planAdherenceGrade] ?? "border-border bg-surface-raised text-muted"
            : "border-border bg-surface-raised text-muted",
        )}
      >
        <span className="text-3xl font-black leading-none">
          {day.planAdherenceGrade || "—"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide">
            {day.planAdherenceGrade ? "Plan adherence grade" : "Not graded yet"}
          </p>
          <p className="truncate text-[11px] italic opacity-80">
            &ldquo;{dailyQuote}&rdquo;
          </p>
        </div>
      </div>

      <DayPerformanceCard trades={day.trades} />

      {day.aiSummary && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            AI summary
          </p>
          <p className="mt-1 text-sm text-foreground">{day.aiSummary}</p>
        </div>
      )}

      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Pre-market plan
          </h2>
          <form action={clearPreMarketPlanAction}>
            <input type="hidden" name="id" value={day.id} />
            <input type="hidden" name="date" value={date} />
            <ConfirmSubmitButton
              confirmMessage="Clear the pre-market plan and checklist for this day? This can't be undone."
              className="text-xs font-medium text-loss hover:underline"
            >
              Clear
            </ConfirmSubmitButton>
          </form>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Info label="HTF bias" value={day.htfBias} />
          <Info label="Key levels" value={day.keyLevels} />
          <Info label="Session timing" value={day.sessionTiming} />
          <Info label="News" value={day.news} />
          <Info
            label="Max loss plan"
            value={day.maxLossPlan != null ? formatCurrency(day.maxLossPlan) : null}
          />
          <Info label="Position size plan" value={day.positionSizePlan} />
          <Info
            label="Max trade count"
            value={day.maxTradeCountPlan?.toString() ?? null}
          />
        </dl>
        {day.planScreenshots.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {day.planScreenshots.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s.id}
                src={s.filePath}
                alt="Pre-market plan screenshot"
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Pre-market checklist
        </h2>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-muted">
              Mindset & physiology reset
            </span>
            <ul className="mt-1 flex flex-col gap-1">
              {MINDSET_RESET_ITEMS.map((item) => (
                <li key={item.key} className="text-foreground">
                  {checklist.mindsetReset[item.key] ? "✅" : "⬜"} {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Info label="Instrument" value={checklist.symbol} />
            <Info
              label="Recent expansion?"
              value={yesNo(checklist.sessionAnalysis.hadRecentExpansion)}
            />
            <Info
              label="Expansion note"
              value={checklist.sessionAnalysis.expansionNote}
            />
            {checklist.sessionAnalysis.hadRecentExpansion && (
              <Info
                label="Caution note"
                value={checklist.sessionAnalysis.cautionNote}
              />
            )}
          </div>
          <Info
            label={`${checklist.symbol || "HTF"} 4H structure`}
            value={structureLabel(checklist.htf4hStructure)}
          />
          <Info
            label={`${checklist.symbol || "HTF"} 1H structure`}
            value={structureLabel(checklist.htf1hStructure)}
          />
          <Info
            label="Daily range location"
            value={
              checklist.dailyRangeLocation
                ? checklist.dailyRangeLocation[0].toUpperCase() +
                  checklist.dailyRangeLocation.slice(1)
                : null
            }
          />
          <Info
            label="Bias"
            value={
              checklist.biasDirection
                ? checklist.biasDirection[0].toUpperCase() +
                  checklist.biasDirection.slice(1)
                : null
            }
          />
          <div className="sm:col-span-2">
            <span className="text-xs font-medium text-muted">
              Draw on liquidity
            </span>
            {checklist.drawOnLiquidity.length === 0 ? (
              <p className="mt-0.5 text-foreground">—</p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {checklist.drawOnLiquidity.map((key) => (
                  <span
                    key={key}
                    className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted"
                  >
                    {DOL_OPTIONS.find((o) => o.key === key)?.label ?? key}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Info
            label="Liquidity modeled"
            value={checklist.liquidityModelingDone ? "Yes" : "No"}
          />
          <Info
            label="Energy 7/10+"
            value={yesNo(checklist.personalCheck.energyOk)}
          />
          <Info
            label="Slept 6+ hours"
            value={yesNo(checklist.personalCheck.sleptEnough)}
          />
          <Info
            label="Emotionally neutral"
            value={yesNo(checklist.personalCheck.emotionallyNeutral)}
          />
          <Info
            label="Stressor present"
            value={yesNo(checklist.personalCheck.hasStressor)}
          />
          {checklist.personalCheck.hasStressor && (
            <Info
              label="Stressor note"
              value={checklist.personalCheck.stressorNote}
            />
          )}
          <Info
            label="Following process, not chasing payout"
            value={yesNo(checklist.personalCheck.followingProcess)}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Trades</h2>
        {day.trades.length === 0 ? (
          <p className="text-sm text-muted">No trades logged.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {day.trades.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {t.symbol} · {t.direction.toUpperCase()}
                    {t.entryModel ? ` · ${t.entryModel}` : ""}
                    {t.setupGrade ? ` · Grade ${t.setupGrade}` : ""}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        (t.netPnl ?? 0) >= 0
                          ? "font-semibold text-profit"
                          : "font-semibold text-loss"
                      }
                    >
                      {formatCurrency(t.netPnl)} ({formatR(t.rMultiple)})
                    </span>
                    <form action={deleteTradeAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="date" value={date} />
                      <ConfirmSubmitButton
                        confirmMessage={`Delete this ${t.symbol} trade? This can't be undone.`}
                        className="text-xs font-medium text-loss hover:underline"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
                {(t.confluenceFactors.length > 0 || t.mistakes.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.confluenceFactors.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted"
                      >
                        {c.label}
                      </span>
                    ))}
                    {t.mistakes.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-full bg-loss-muted px-2 py-0.5 text-xs text-loss"
                      >
                        {m.label}
                      </span>
                    ))}
                  </div>
                )}
                {t.writeup && (
                  <p className="mt-2 text-sm text-muted">{t.writeup}</p>
                )}
                {t.screenshots.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {t.screenshots.map((s) => (
                      <a
                        key={s.id}
                        href={s.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-border transition-colors hover:border-accent/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.filePath}
                          alt="Trade screenshot"
                          className="h-20 w-20 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Missed trades
        </h2>
        {day.missedTrades.length === 0 ? (
          <p className="text-sm text-muted">None logged.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {day.missedTrades.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {m.symbol}
                    {m.entryModel ? ` · ${m.entryModel}` : ""}
                    {m.estimatedRMultiple != null && (
                      <span className="ml-2 text-xs font-normal text-muted">
                        est. {m.estimatedRMultiple.toFixed(2)}R
                      </span>
                    )}
                  </span>
                  <form action={deleteMissedTradeAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="date" value={date} />
                    <ConfirmSubmitButton
                      confirmMessage={`Delete this missed trade (${m.symbol})? This can't be undone.`}
                      className="text-xs font-medium text-loss hover:underline"
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
                {m.setupDescription && (
                  <p className="mt-1 text-sm text-muted">
                    {m.setupDescription}
                  </p>
                )}
                {m.reasonMissed && (
                  <p className="mt-1 text-sm text-loss">{m.reasonMissed}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Post-session review
          </h2>
          <form action={clearPostSessionReviewAction}>
            <input type="hidden" name="id" value={day.id} />
            <input type="hidden" name="date" value={date} />
            <ConfirmSubmitButton
              confirmMessage="Clear the post-session review and scorecard for this day? This can't be undone."
              className="text-xs font-medium text-loss hover:underline"
            >
              Clear
            </ConfirmSubmitButton>
          </form>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Info label="Plan adherence grade" value={day.planAdherenceGrade} />
          <Info label="Psychology log" value={day.psychologyLog} />
          <Info label="Notes" value={day.freeformNotes} />
        </dl>
        {day.ruleViolations.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-medium text-muted">
              Rule violations
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {day.ruleViolations.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full bg-loss-muted px-2 py-0.5 text-xs text-loss"
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Daily process scorecard
        </h2>
        <div className="flex flex-col">
          {SCORECARD_CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0"
            >
              <span className="text-foreground">{cat.label}</span>
              <span className="font-medium text-foreground">
                {scorecard[cat.key] ?? "—"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">
            Total daily score: {scorecardTotalValue} / {SCORECARD_MAX_POINTS}
          </span>
          <span className={`text-xs font-medium ${scorecardBandValue.colorClass}`}>
            {scorecardBandValue.label}
          </span>
        </div>
      </section>
    </div>
  );
}

const GRADE_BADGE_STYLES: Record<string, string> = {
  "A+": "border-profit/60 bg-profit-muted text-profit shadow-[0_0_20px_-6px_var(--profit)]",
  A: "border-profit/50 bg-profit-muted text-profit shadow-[0_0_16px_-8px_var(--profit)]",
  B: "border-accent/50 bg-accent/10 text-accent shadow-[0_0_16px_-8px_var(--accent)]",
  C: "border-loss/40 bg-loss-muted text-loss",
};

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value || "—"}</dd>
    </div>
  );
}

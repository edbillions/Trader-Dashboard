import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { DatalistInput } from "@/components/ui/datalist-input";
import { Gauge } from "@/components/ui/gauge";
import { Stat } from "@/components/reviews/stat";
import { ScoreboardSection } from "@/components/reviews/scoreboard-section";
import { GradeScaleSection } from "@/components/reviews/grade-scale-section";
import { MistakeTrackerSection } from "@/components/reviews/mistake-tracker-section";
import { RuleViolationsSection } from "@/components/reviews/rule-violations-section";
import { PatternRecognitionSection } from "@/components/reviews/pattern-recognition-section";
import { LessonsAndActionItemsSection } from "@/components/reviews/lessons-action-items-section";
import { PlaybookUpdateSection } from "@/components/reviews/playbook-update-section";
import { CeoQuestionsSection } from "@/components/reviews/ceo-questions-section";
import { TradeBreakdownSection } from "@/components/reviews/trade-breakdown-section";
import { OpportunityReviewSection } from "@/components/reviews/opportunity-review-section";
import { ScreenshotReviewSection } from "@/components/reviews/screenshot-review-section";
import { AiDraftButton } from "@/components/reviews/ai-draft-button";
import { getReviewDetail } from "@/lib/data/reviews";
import { updateReviewAction, deleteReviewAction } from "@/lib/actions/reviews";
import { formatCurrency, formatR } from "@/lib/pnl";
import { isWeeklyTemplate } from "@/lib/domain/period-review";
import {
  PROCESS_SCORE_CATEGORIES,
  CONFIDENCE_SCORE_CATEGORIES,
  DECISION_QUALITY_CATEGORIES,
  PERIOD_GRADE_CATEGORIES,
  parseProcessScore,
  parseConfidenceScores,
  parseDecisionQualityScore,
  parsePeriodGrade,
} from "@/lib/types/weekly-review";
import {
  parseTradeBreakdown,
  parseOpportunityReview,
  parseScreenshotReview,
  parseMistakeTracker,
  parseRuleViolationsSummary,
  parsePatternRecognition,
  parsePlaybookUpdate,
  parseCeoQuestions,
  parseThreeItems,
} from "@/lib/types/review-sections";

export const dynamic = "force-dynamic";

const CATEGORY_SUGGESTIONS = ["Discipline", "Performance", "Psychology"];

const PERIOD_TYPE_LABELS: Record<string, string> = {
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
  custom: "Custom",
};

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReviewDetail(id);
  if (!review) notFound();

  const weekly = isWeeklyTemplate(review.periodType);
  const periodTypeLabel = review.periodType
    ? (PERIOD_TYPE_LABELS[review.periodType] ?? review.periodType)
    : "Rolled-up (legacy)";

  const processScore = parseProcessScore(review.processScore);
  const confidenceScores = parseConfidenceScores(review.confidenceScores);
  const decisionQualityScore = parseDecisionQualityScore(review.decisionQualityScore);
  const periodGrade = parsePeriodGrade(review.periodGrade);
  const tradeBreakdown = parseTradeBreakdown(review.tradeBreakdown);
  const opportunityReview = parseOpportunityReview(review.opportunityReview);
  const screenshotReview = parseScreenshotReview(review.screenshotReview);
  const mistakeTracker = parseMistakeTracker(review.mistakeTracker);
  const ruleViolationsSummary = parseRuleViolationsSummary(review.ruleViolationsSummary);
  const patternRecognition = parsePatternRecognition(review.patternRecognition);
  const playbookUpdate = parsePlaybookUpdate(review.playbookUpdate);
  const ceoQuestions = parseCeoQuestions(review.ceoQuestions);
  const lessonsLearned = parseThreeItems(review.lessonsLearned);
  const actionItems = parseThreeItems(review.actionItems);

  const navSections = [
    { id: "scoreboard", label: "Scoreboard" },
    ...(weekly ? [{ id: "process-score", label: "Process Score" }] : []),
    ...(weekly ? [{ id: "trade-breakdown", label: "Trade Breakdown" }] : []),
    ...(weekly ? [{ id: "opportunity-review", label: "Opportunity Review" }] : []),
    { id: "mistake-tracker", label: "Mistake Tracker" },
    { id: "rule-violations", label: "Rule Violations" },
    { id: "pattern-recognition", label: "Pattern Recognition" },
    ...(weekly ? [{ id: "screenshot-review", label: "Screenshot Review" }] : []),
    { id: "lessons-action-items", label: "Lessons & Action Items" },
    ...(weekly ? [{ id: "confidence-scores", label: "Confidence Scores" }] : []),
    { id: "playbook-update", label: "Playbook Update" },
    { id: "period-grade", label: "Grade" },
    { id: "ceo-questions", label: "CEO Questions" },
    ...(weekly ? [{ id: "decision-quality", label: "Decision Quality" }] : []),
  ];

  return (
    <div>
      <PageHeader
        title={review.title}
        description={
          review.isDraft
            ? "Draft — needs your review. Saving clears the draft flag."
            : "Winners, losers, win rate, and net are computed live from trades in the period."
        }
        actions={<AiDraftButton reviewId={review.id} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Trades"
          value={`${review.stats.tradeCount} (${review.stats.winners}W / ${review.stats.losers}L)`}
        />
        <Stat
          label="Win rate"
          value={review.stats.winRate != null ? `${review.stats.winRate.toFixed(0)}%` : "—"}
        />
        <Stat
          label="Net"
          value={`${formatCurrency(review.stats.netPnl)} · ${formatR(review.stats.netR)}`}
          positive={review.stats.netPnl >= 0}
        />
        <div className="rounded-xl border border-border bg-surface p-4">
          <Gauge
            label="Tiltmeter"
            usedLabel={`${review.tiltmeter.signalCount} signals`}
            limitLabel={`${review.tiltmeter.daysWithTrades} trading day${review.tiltmeter.daysWithTrades === 1 ? "" : "s"}`}
            pct={review.tiltmeter.pct}
          />
        </div>
      </div>

      <nav className="sticky top-0 z-10 mb-6 flex flex-wrap gap-x-4 gap-y-1 border-b border-border bg-background py-2 text-xs">
        {navSections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="text-muted hover:text-accent">
            {s.label}
          </a>
        ))}
      </nav>

      <form action={updateReviewAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={review.id} />
        <input type="hidden" name="periodType" value={review.periodType ?? "custom"} />
        <input
          type="hidden"
          name="periodGradeAiSuggestion"
          value={JSON.stringify(periodGrade.aiSuggestion)}
        />

        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <Field label="Title">
            <TextInput name="title" defaultValue={review.title} required />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Period type</span>
              <p className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-muted">
                {periodTypeLabel}
              </p>
            </div>
            <Field label="Period start">
              <TextInput
                name="periodStart"
                type="date"
                defaultValue={toDateInputValue(review.periodStart)}
                required
              />
            </Field>
            <Field label="Period end">
              <TextInput
                name="periodEnd"
                type="date"
                defaultValue={toDateInputValue(review.periodEnd)}
                required
              />
            </Field>
          </div>

          <Field label="Category (optional)">
            <DatalistInput
              name="category"
              options={CATEGORY_SUGGESTIONS}
              defaultValue={review.category ?? ""}
            />
          </Field>

          <Field label="Rating (1-5, optional)">
            <TextInput
              name="rating"
              type="number"
              min={1}
              max={5}
              step={1}
              defaultValue={review.rating ?? ""}
            />
          </Field>

          <Field label="Notes">
            <TextArea
              name="notes"
              defaultValue={review.notes ?? ""}
              placeholder="What went well, what to fix, what to focus on next period..."
            />
          </Field>
        </div>

        <div id="scoreboard">
          <ScoreboardSection
            tradeCount={review.detail.trades.length}
            netR={review.detail.scoreboard.netR}
            winRate={review.detail.scoreboard.winRate}
            profitFactor={review.detail.scoreboard.profitFactor}
            tradeExpectancy={review.detail.scoreboard.tradeExpectancy}
            avgWin={review.detail.scoreboard.avgWin}
            avgLoss={review.detail.scoreboard.avgLoss}
            largestProfit={review.detail.scoreboard.largestProfit}
            largestLoss={review.detail.scoreboard.largestLoss}
            aPlusSetupsPassed={review.detail.scoreboard.aPlusSetupsPassed}
            ruleViolationCount={review.detail.scoreboard.ruleViolationCount}
          />
        </div>

        {weekly && (
          <div id="process-score">
            <GradeScaleSection
              title="Process Score"
              namePrefix="processScore"
              categories={PROCESS_SCORE_CATEGORIES}
              defaultScores={processScore}
            />
          </div>
        )}

        {weekly && (
          <div id="trade-breakdown">
            <TradeBreakdownSection trades={review.detail.trades} breakdown={tradeBreakdown} />
          </div>
        )}

        {weekly && (
          <div id="opportunity-review">
            <OpportunityReviewSection
              missedTrades={review.detail.missedTrades}
              defaultNarrative={opportunityReview.narrative}
            />
          </div>
        )}

        <div id="mistake-tracker">
          <MistakeTrackerSection
            breakdown={review.detail.mistakeBreakdown}
            defaultCostliestLabel={mistakeTracker.costliestMistakeLabel}
            defaultNarrative={mistakeTracker.narrative}
          />
        </div>

        <div id="rule-violations">
          <RuleViolationsSection
            breakdown={review.detail.ruleViolationBreakdown}
            defaultNarrative={ruleViolationsSummary.narrative}
          />
        </div>

        <div id="pattern-recognition">
          <PatternRecognitionSection
            byDayOfWeek={review.detail.patternRecognition.byDayOfWeek}
            bySymbol={review.detail.patternRecognition.bySymbol}
            byDirection={review.detail.patternRecognition.byDirection}
            bySession={review.detail.patternRecognition.bySession}
            bySetupGrade={review.detail.patternRecognition.bySetupGrade}
            defaultNarrative={patternRecognition.narrative}
          />
        </div>

        {weekly && (
          <div id="screenshot-review">
            <ScreenshotReviewSection trades={review.detail.trades} defaultPicks={screenshotReview} />
          </div>
        )}

        <div id="lessons-action-items">
          <LessonsAndActionItemsSection
            defaultLessons={lessonsLearned}
            defaultActionItems={actionItems}
          />
        </div>

        {weekly && (
          <div id="confidence-scores">
            <GradeScaleSection
              title="Confidence Scores"
              namePrefix="confidenceScores"
              categories={CONFIDENCE_SCORE_CATEGORIES}
              defaultScores={confidenceScores}
            />
          </div>
        )}

        <div id="playbook-update">
          <PlaybookUpdateSection defaultNotes={playbookUpdate.notes} />
        </div>

        <div id="period-grade">
          <GradeScaleSection
            title={weekly ? "Weekly Grade" : "Period Grade"}
            namePrefix="periodGrade"
            categories={PERIOD_GRADE_CATEGORIES}
            defaultScores={periodGrade.scores}
            aiSuggestion={periodGrade.aiSuggestion}
          />
        </div>

        <div id="ceo-questions">
          <CeoQuestionsSection defaultValues={ceoQuestions} />
        </div>

        {weekly && (
          <div id="decision-quality">
            <GradeScaleSection
              title="Decision Quality Score"
              namePrefix="decisionQualityScore"
              categories={DECISION_QUALITY_CATEGORIES}
              defaultScores={decisionQualityScore}
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Save review
          </button>
          <button
            formAction={deleteReviewAction}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-loss hover:bg-surface-raised"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isWeeklyTemplate } from "@/lib/domain/period-review";
import {
  PROCESS_SCORE_CATEGORIES,
  CONFIDENCE_SCORE_CATEGORIES,
  DECISION_QUALITY_CATEGORIES,
  PERIOD_GRADE_CATEGORIES,
  type GradeCategory,
} from "@/lib/types/weekly-review";
import { getReviewDetail } from "@/lib/data/reviews";
import {
  generateLessonsAndActionItems,
  generateMistakeTrackerNarrative,
  generateRuleViolationsNarrative,
  generatePatternRecognitionNarrative,
  generateOpportunityReviewNarrative,
  generateCeoQuestions,
  generatePeriodGradeSuggestion,
  type PeriodReflectionInput,
} from "@/lib/ai/period-review-sections";

function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function requiredStartDate(formData: FormData, key: string): Date {
  return new Date(`${requiredString(formData, key)}T00:00:00`);
}

// periodEnd must be end-of-day so trades occurring on that calendar date
// (and the auto-draft's exact-datetime dedupe check) both stay correct.
function requiredEndDate(formData: FormData, key: string): Date {
  return new Date(`${requiredString(formData, key)}T23:59:59.999`);
}

function optionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalRating(formData: FormData): number | null {
  const value = formData.get("rating");
  if (typeof value !== "string" || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function optionalScores(
  formData: FormData,
  prefix: string,
  categories: GradeCategory[],
): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  for (const c of categories) {
    const raw = formData.get(`${prefix}.${c.key}`);
    if (typeof raw === "string" && raw !== "") {
      const num = Number(raw);
      result[c.key] = Number.isFinite(num) ? num : null;
    } else {
      result[c.key] = null;
    }
  }
  return result;
}

function optionalThreeItems(formData: FormData, prefix: string): string[] {
  const items: string[] = [];
  for (let i = 0; i < 3; i++) {
    const value = formData.get(`${prefix}.${i}`);
    if (typeof value === "string" && value.trim()) items.push(value.trim());
  }
  return items;
}

// Builds every structured JSON section from a single form submission,
// namespaced by field name (e.g. "processScore.preparation",
// "tradeBreakdown.<tradeId>.executionScore"). Missing fields (e.g. on the
// minimal /new form, which doesn't render trade-dependent sections) parse
// to their empty shape harmlessly.
function buildStructuredFields(formData: FormData, periodType: string, tradeIds: string[]) {
  const always = {
    mistakeTracker: JSON.stringify({
      costliestMistakeLabel: optionalString(formData, "mistakeTracker.costliestMistakeLabel"),
      narrative: optionalString(formData, "mistakeTracker.narrative"),
    }),
    ruleViolationsSummary: JSON.stringify({
      narrative: optionalString(formData, "ruleViolationsSummary.narrative"),
    }),
    patternRecognition: JSON.stringify({
      narrative: optionalString(formData, "patternRecognition.narrative"),
    }),
    lessonsLearned: JSON.stringify(optionalThreeItems(formData, "lessonsLearned")),
    actionItems: JSON.stringify(optionalThreeItems(formData, "actionItems")),
    playbookUpdate: JSON.stringify({
      notes: optionalString(formData, "playbookUpdate.notes"),
    }),
    periodGrade: JSON.stringify({
      scores: optionalScores(formData, "periodGrade", PERIOD_GRADE_CATEGORIES),
      aiSuggestion: parseAiSuggestion(formData.get("periodGradeAiSuggestion")),
    }),
    ceoQuestions: JSON.stringify({
      mostProfit: optionalString(formData, "ceoQuestions.mostProfit"),
      mostCost: optionalString(formData, "ceoQuestions.mostCost"),
      repeatingPattern: optionalString(formData, "ceoQuestions.repeatingPattern"),
      oneHabit: optionalString(formData, "ceoQuestions.oneHabit"),
      satisfiedIfIdentical: optionalString(formData, "ceoQuestions.satisfiedIfIdentical"),
    }),
  };

  if (!isWeeklyTemplate(periodType)) {
    return {
      ...always,
      processScore: null,
      confidenceScores: null,
      decisionQualityScore: null,
      tradeBreakdown: null,
      opportunityReview: null,
      screenshotReview: null,
    };
  }

  const tradeBreakdown: Record<string, unknown> = {};
  for (const tradeId of tradeIds) {
    const executionRaw = formData.get(`tradeBreakdown.${tradeId}.executionScore`);
    const confidenceRaw = formData.get(`tradeBreakdown.${tradeId}.confidenceScore`);
    tradeBreakdown[tradeId] = {
      whatWentWell: optionalString(formData, `tradeBreakdown.${tradeId}.whatWentWell`),
      improvements: optionalString(formData, `tradeBreakdown.${tradeId}.improvements`),
      executionScore:
        typeof executionRaw === "string" && executionRaw !== "" ? Number(executionRaw) : null,
      confidenceScore:
        typeof confidenceRaw === "string" && confidenceRaw !== "" ? Number(confidenceRaw) : null,
    };
  }

  return {
    ...always,
    processScore: JSON.stringify(optionalScores(formData, "processScore", PROCESS_SCORE_CATEGORIES)),
    confidenceScores: JSON.stringify(
      optionalScores(formData, "confidenceScores", CONFIDENCE_SCORE_CATEGORIES),
    ),
    decisionQualityScore: JSON.stringify(
      optionalScores(formData, "decisionQualityScore", DECISION_QUALITY_CATEGORIES),
    ),
    tradeBreakdown: JSON.stringify(tradeBreakdown),
    opportunityReview: JSON.stringify({
      narrative: optionalString(formData, "opportunityReview.narrative"),
    }),
    screenshotReview: JSON.stringify({
      bestTradeId: optionalString(formData, "screenshotReview.bestTradeId"),
      bestTradeScreenshotId: optionalString(formData, "screenshotReview.bestTradeScreenshotId"),
      worstTradeId: optionalString(formData, "screenshotReview.worstTradeId"),
      worstTradeScreenshotId: optionalString(formData, "screenshotReview.worstTradeScreenshotId"),
      bestMissedSetupNote: optionalString(formData, "screenshotReview.bestMissedSetupNote"),
      biggestMistakeTradeId: optionalString(formData, "screenshotReview.biggestMistakeTradeId"),
      biggestMistakeScreenshotId: optionalString(
        formData,
        "screenshotReview.biggestMistakeScreenshotId",
      ),
    }),
  };
}

function parseAiSuggestion(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function createReviewAction(formData: FormData) {
  const title = requiredString(formData, "title");
  const periodStart = requiredStartDate(formData, "periodStart");
  const periodEnd = requiredEndDate(formData, "periodEnd");
  const periodType = requiredString(formData, "periodType");
  const structured = buildStructuredFields(formData, periodType, []);

  const review = await prisma.periodReview.create({
    data: {
      title,
      periodStart,
      periodEnd,
      periodType,
      category: optionalString(formData, "category"),
      rating: optionalRating(formData),
      notes: optionalString(formData, "notes"),
      isDraft: false,
      ...structured,
    },
  });

  revalidatePath("/reviews");
  redirect(`/reviews/${review.id}`);
}

export async function updateReviewAction(formData: FormData) {
  const id = requiredString(formData, "id");
  const title = requiredString(formData, "title");
  const periodStart = requiredStartDate(formData, "periodStart");
  const periodEnd = requiredEndDate(formData, "periodEnd");
  const periodType = requiredString(formData, "periodType");
  const tradeIds = formData.getAll("tradeIds").filter((v): v is string => typeof v === "string");
  const structured = buildStructuredFields(formData, periodType, tradeIds);

  await prisma.periodReview.update({
    where: { id },
    data: {
      title,
      periodStart,
      periodEnd,
      periodType,
      category: optionalString(formData, "category"),
      rating: optionalRating(formData),
      notes: optionalString(formData, "notes"),
      isDraft: false,
      ...structured,
    },
  });

  revalidatePath("/reviews");
  revalidatePath(`/reviews/${id}`);
}

export async function deleteReviewAction(formData: FormData) {
  const id = requiredString(formData, "id");
  await prisma.periodReview.delete({ where: { id } });
  revalidatePath("/reviews");
  redirect("/reviews");
}

export async function generateReviewAiDraftAction(
  reviewId: string,
): Promise<{ available: boolean }> {
  const review = await getReviewDetail(reviewId);
  if (!review) return { available: false };

  const weekly = isWeeklyTemplate(review.periodType);
  const periodLabel = `${review.periodStart.toISOString().slice(0, 10)} – ${review.periodEnd.toISOString().slice(0, 10)}`;

  const input: PeriodReflectionInput = {
    periodLabel,
    isWeekly: weekly,
    scoreboard: {
      tradeCount: review.detail.trades.length,
      winRate: review.detail.scoreboard.winRate ?? null,
      profitFactor: review.detail.scoreboard.profitFactor ?? null,
      tradeExpectancy: review.detail.scoreboard.tradeExpectancy ?? null,
      avgWin: review.detail.scoreboard.avgWin ?? null,
      avgLoss: review.detail.scoreboard.avgLoss ?? null,
      largestProfit: review.detail.scoreboard.largestProfit ?? null,
      largestLoss: review.detail.scoreboard.largestLoss ?? null,
      netR: review.detail.scoreboard.netR,
      aPlusSetupsPassed: review.detail.scoreboard.aPlusSetupsPassed,
      ruleViolationCount: review.detail.scoreboard.ruleViolationCount,
    },
    patternRecognition: review.detail.patternRecognition,
    mistakeBreakdown: review.detail.mistakeBreakdown,
    ruleViolationBreakdown: review.detail.ruleViolationBreakdown,
    missedTrades: review.detail.missedTrades.map((m) => ({
      symbol: m.symbol,
      setupDescription: m.setupDescription,
      reasonMissed: m.reasonMissed,
      estimatedRMultiple: m.estimatedRMultiple,
    })),
  };

  if (input.scoreboard.tradeCount === 0) return { available: false };

  const [lessonsAndActions, mistakeNarrative, ruleViolationsNarrative, patternNarrative, ceoQuestions, gradeSuggestion, opportunityNarrative] =
    await Promise.all([
      generateLessonsAndActionItems(input),
      generateMistakeTrackerNarrative(input),
      generateRuleViolationsNarrative(input),
      generatePatternRecognitionNarrative(input),
      generateCeoQuestions(input),
      generatePeriodGradeSuggestion(input),
      weekly ? generateOpportunityReviewNarrative(input) : Promise.resolve(null),
    ]);

  if (
    !lessonsAndActions &&
    !mistakeNarrative &&
    !ruleViolationsNarrative &&
    !patternNarrative &&
    !ceoQuestions &&
    !gradeSuggestion &&
    !opportunityNarrative
  ) {
    return { available: false };
  }

  const existingPeriodGrade = JSON.parse(
    review.periodGrade ?? '{"scores":{},"aiSuggestion":null}',
  );

  await prisma.periodReview.update({
    where: { id: reviewId },
    data: {
      ...(lessonsAndActions
        ? {
            lessonsLearned: JSON.stringify(lessonsAndActions.lessons),
            actionItems: JSON.stringify(lessonsAndActions.actionItems),
          }
        : {}),
      ...(mistakeNarrative
        ? {
            mistakeTracker: JSON.stringify({
              costliestMistakeLabel: review.detail.mistakeBreakdown[0]?.label ?? null,
              narrative: mistakeNarrative,
            }),
          }
        : {}),
      ...(ruleViolationsNarrative
        ? { ruleViolationsSummary: JSON.stringify({ narrative: ruleViolationsNarrative }) }
        : {}),
      ...(patternNarrative
        ? { patternRecognition: JSON.stringify({ narrative: patternNarrative }) }
        : {}),
      ...(ceoQuestions ? { ceoQuestions: JSON.stringify(ceoQuestions) } : {}),
      ...(gradeSuggestion
        ? {
            periodGrade: JSON.stringify({
              scores: existingPeriodGrade.scores ?? {},
              aiSuggestion: gradeSuggestion,
            }),
          }
        : {}),
      ...(weekly && opportunityNarrative
        ? { opportunityReview: JSON.stringify({ narrative: opportunityNarrative }) }
        : {}),
    },
  });

  revalidatePath(`/reviews/${reviewId}`);
  return { available: true };
}

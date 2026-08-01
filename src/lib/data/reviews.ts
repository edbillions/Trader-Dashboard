import { prisma } from "@/lib/prisma";
import {
  computePeriodStats,
  computeTiltmeter,
  getLastCompletedWeekRange,
  isWeeklyTemplate,
} from "@/lib/domain/period-review";
import { detectTiltSignals, type TiltDayInput } from "@/lib/domain/tilt";
import { computeTradeStats } from "@/lib/domain/trade-stats";
import { groupStats, type GroupStat } from "@/lib/data/analytics";
import { generatePeriodReviewSummary } from "@/lib/ai/period-review-summary";
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

async function getTradesInRange(start: Date, end: Date) {
  return prisma.trade.findMany({
    where: { entryTime: { gte: start, lte: end } },
    select: { netPnl: true, rMultiple: true },
  });
}

async function getTradingDaysInRange(start: Date, end: Date) {
  return prisma.tradingDay.findMany({
    where: { date: { gte: start, lte: end } },
    select: {
      date: true,
      maxTradeCountPlan: true,
      sessionTiming: true,
      ruleViolations: { select: { id: true, label: true } },
      trades: {
        select: {
          id: true,
          entryTime: true,
          exitTime: true,
          positionSize: true,
          netPnl: true,
          session: true,
        },
      },
    },
  });
}

// Broader, detail-page-only trade query — includes everything the Trade
// Breakdown, Mistake Tracker, Pattern Recognition, and Screenshot Review
// sections need, mirroring the include shape already used by
// getAnalyticsData() in src/lib/data/analytics.ts.
async function getFullTradesInRange(start: Date, end: Date) {
  return prisma.trade.findMany({
    where: { entryTime: { gte: start, lte: end } },
    include: {
      confluenceFactors: true,
      mistakes: true,
      screenshots: true,
      tags: { include: { category: true } },
      tradingDay: {
        select: { date: true, ruleViolations: { select: { id: true, label: true } } },
      },
    },
    orderBy: { entryTime: "asc" },
  });
}

export type FullTrade = Awaited<ReturnType<typeof getFullTradesInRange>>[number];

async function getMissedTradesInRange(start: Date, end: Date) {
  return prisma.missedTrade.findMany({
    where: { tradingDay: { date: { gte: start, lte: end } } },
    include: { confluenceFactors: true, tags: { include: { category: true } } },
  });
}

async function computePeriodSummary(periodStart: Date, periodEnd: Date) {
  const [trades, tradingDays] = await Promise.all([
    getTradesInRange(periodStart, periodEnd),
    getTradingDaysInRange(periodStart, periodEnd),
  ]);

  const stats = computePeriodStats(trades);

  const signals = tradingDays.flatMap((d) =>
    detectTiltSignals({
      date: d.date.toISOString().slice(0, 10),
      maxTradeCountPlan: d.maxTradeCountPlan,
      sessionTiming: d.sessionTiming,
      trades: d.trades,
    } satisfies TiltDayInput),
  );
  const daysWithTrades = tradingDays.filter((d) => d.trades.length > 0).length;
  const tiltmeter = computeTiltmeter(signals.length, daysWithTrades);

  return { stats, tiltmeter };
}

// ---------- Detail-page-only aggregates (live-computed, never persisted) ----------

async function computeScoreboardStats(periodStart: Date, periodEnd: Date) {
  const [fullTrades, tradingDays] = await Promise.all([
    getFullTradesInRange(periodStart, periodEnd),
    getTradingDaysInRange(periodStart, periodEnd),
  ]);

  const tradeStats = computeTradeStats(fullTrades, tradingDays);
  const netR = fullTrades.reduce((s, t) => s + (t.rMultiple ?? 0), 0);
  const aPlusSetupsPassed = fullTrades.filter((t) => t.setupGrade === "A+").length;
  const ruleViolationCount = tradingDays.reduce(
    (s, d) => s + d.ruleViolations.length,
    0,
  );
  const decided = tradeStats.winningTradeCount + tradeStats.losingTradeCount;
  const winRate = decided > 0 ? (tradeStats.winningTradeCount / decided) * 100 : null;

  return { ...tradeStats, winRate, netR, aPlusSetupsPassed, ruleViolationCount };
}

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function computePeriodPatternRecognition(trades: FullTrade[]) {
  return {
    byDayOfWeek: groupStats(trades, (t) => WEEKDAY_LABELS[t.entryTime.getDay()]),
    bySymbol: groupStats(trades, (t) => t.symbol),
    byDirection: groupStats(trades, (t) => t.direction),
    bySession: groupStats(trades, (t) => t.session),
    bySetupGrade: groupStats(trades, (t) => t.setupGrade),
  };
}

function computeMistakeBreakdown(trades: FullTrade[]): GroupStat[] {
  const groups = new Map<string, FullTrade[]>();
  for (const t of trades) {
    for (const m of t.mistakes) {
      if (!groups.has(m.label)) groups.set(m.label, []);
      groups.get(m.label)!.push(t);
    }
  }
  return Array.from(groups.entries())
    .map(([label, group]) => groupStats(group, () => label)[0])
    .sort((a, b) => a.netPnl - b.netPnl); // most costly (most negative) first
}

function computeRuleViolationBreakdown(
  tradingDays: Awaited<ReturnType<typeof getTradingDaysInRange>>,
): { label: string; count: number }[] {
  const groups = new Map<string, number>();
  for (const d of tradingDays) {
    for (const v of d.ruleViolations) {
      groups.set(v.label, (groups.get(v.label) ?? 0) + 1);
    }
  }
  return Array.from(groups.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

async function computeReviewDetailData(
  periodStart: Date,
  periodEnd: Date,
  periodType: string | null,
) {
  const [scoreboard, fullTrades, tradingDays, missedTrades] = await Promise.all([
    computeScoreboardStats(periodStart, periodEnd),
    getFullTradesInRange(periodStart, periodEnd),
    getTradingDaysInRange(periodStart, periodEnd),
    isWeeklyTemplate(periodType)
      ? getMissedTradesInRange(periodStart, periodEnd)
      : Promise.resolve([]),
  ]);

  return {
    scoreboard,
    trades: fullTrades,
    missedTrades,
    patternRecognition: computePeriodPatternRecognition(fullTrades),
    mistakeBreakdown: computeMistakeBreakdown(fullTrades),
    ruleViolationBreakdown: computeRuleViolationBreakdown(tradingDays),
  };
}

// Auto-drafts a review for the most recently completed Mon-Sun week, once
// per week, only if that week actually has trades and no review already
// exists for it. Stays local-only (runs on next page load) rather than a
// true background cron, since this app has no persistent hosting.
async function ensureWeeklyAutoDraft() {
  const today = new Date();
  if (today.getDay() === 0) return; // wait until Monday+ to review last week

  const { start, end } = getLastCompletedWeekRange(today);

  const existing = await prisma.periodReview.findFirst({
    where: { periodStart: start, periodEnd: end, periodType: "week" },
  });
  if (existing) return;

  const trades = await getTradesInRange(start, end);
  if (trades.length === 0) return;

  const { stats, tiltmeter } = await computePeriodSummary(start, end);
  const label = `Week of ${start.toISOString().slice(0, 10)}`;
  const aiSummary = await generatePeriodReviewSummary({
    periodLabel: label,
    stats,
    tiltmeter,
  });

  const detail = await computeReviewDetailData(start, end, "week");
  const reflectionInput: PeriodReflectionInput = {
    periodLabel: label,
    isWeekly: true,
    scoreboard: {
      tradeCount: detail.trades.length,
      winRate: detail.scoreboard.winRate,
      profitFactor: detail.scoreboard.profitFactor,
      tradeExpectancy: detail.scoreboard.tradeExpectancy,
      avgWin: detail.scoreboard.avgWin,
      avgLoss: detail.scoreboard.avgLoss,
      largestProfit: detail.scoreboard.largestProfit,
      largestLoss: detail.scoreboard.largestLoss,
      netR: detail.scoreboard.netR,
      aPlusSetupsPassed: detail.scoreboard.aPlusSetupsPassed,
      ruleViolationCount: detail.scoreboard.ruleViolationCount,
    },
    patternRecognition: detail.patternRecognition,
    mistakeBreakdown: detail.mistakeBreakdown,
    ruleViolationBreakdown: detail.ruleViolationBreakdown,
    missedTrades: detail.missedTrades.map((m) => ({
      symbol: m.symbol,
      setupDescription: m.setupDescription,
      reasonMissed: m.reasonMissed,
      estimatedRMultiple: m.estimatedRMultiple,
    })),
  };

  const [
    lessonsAndActions,
    mistakeNarrative,
    ruleViolationsNarrative,
    patternNarrative,
    ceoQuestions,
    gradeSuggestion,
    opportunityNarrative,
  ] = await Promise.all([
    generateLessonsAndActionItems(reflectionInput),
    generateMistakeTrackerNarrative(reflectionInput),
    generateRuleViolationsNarrative(reflectionInput),
    generatePatternRecognitionNarrative(reflectionInput),
    generateCeoQuestions(reflectionInput),
    generatePeriodGradeSuggestion(reflectionInput),
    generateOpportunityReviewNarrative(reflectionInput),
  ]);

  await prisma.periodReview.create({
    data: {
      title: label,
      periodStart: start,
      periodEnd: end,
      periodType: "week",
      notes: aiSummary,
      isDraft: true,
      lessonsLearned: lessonsAndActions ? JSON.stringify(lessonsAndActions.lessons) : null,
      actionItems: lessonsAndActions ? JSON.stringify(lessonsAndActions.actionItems) : null,
      mistakeTracker: mistakeNarrative
        ? JSON.stringify({
            costliestMistakeLabel: detail.mistakeBreakdown[0]?.label ?? null,
            narrative: mistakeNarrative,
          })
        : null,
      ruleViolationsSummary: ruleViolationsNarrative
        ? JSON.stringify({ narrative: ruleViolationsNarrative })
        : null,
      patternRecognition: patternNarrative
        ? JSON.stringify({ narrative: patternNarrative })
        : null,
      ceoQuestions: ceoQuestions ? JSON.stringify(ceoQuestions) : null,
      periodGrade: gradeSuggestion
        ? JSON.stringify({ scores: {}, aiSuggestion: gradeSuggestion })
        : null,
      opportunityReview: opportunityNarrative
        ? JSON.stringify({ narrative: opportunityNarrative })
        : null,
    },
  });
}

export async function getReviewsData() {
  await ensureWeeklyAutoDraft();

  const reviews = await prisma.periodReview.findMany({
    orderBy: { periodStart: "desc" },
  });

  return Promise.all(
    reviews.map(async (r) => {
      const { stats, tiltmeter } = await computePeriodSummary(
        r.periodStart,
        r.periodEnd,
      );
      return { ...r, stats, tiltmeter };
    }),
  );
}

export async function getReviewDetail(id: string) {
  const review = await prisma.periodReview.findUnique({ where: { id } });
  if (!review) return null;

  const [{ stats, tiltmeter }, detail] = await Promise.all([
    computePeriodSummary(review.periodStart, review.periodEnd),
    computeReviewDetailData(review.periodStart, review.periodEnd, review.periodType),
  ]);

  return { ...review, stats, tiltmeter, detail };
}

export type ReviewsData = Awaited<ReturnType<typeof getReviewsData>>;
export type ReviewDetail = Awaited<ReturnType<typeof getReviewDetail>>;

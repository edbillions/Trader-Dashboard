import { prisma } from "@/lib/prisma";
import {
  computePeriodStats,
  computeTiltmeter,
  getLastCompletedWeekRange,
} from "@/lib/domain/period-review";
import { detectTiltSignals, type TiltDayInput } from "@/lib/domain/tilt";
import { generatePeriodReviewSummary } from "@/lib/ai/period-review-summary";

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

// Auto-drafts a review for the most recently completed Mon-Sun week, once
// per week, only if that week actually has trades and no review already
// exists for it. Stays local-only (runs on next page load) rather than a
// true background cron, since this app has no persistent hosting.
async function ensureWeeklyAutoDraft() {
  const today = new Date();
  if (today.getDay() === 0) return; // wait until Monday+ to review last week

  const { start, end } = getLastCompletedWeekRange(today);

  const existing = await prisma.periodReview.findFirst({
    where: { periodStart: start, periodEnd: end, category: "Week" },
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

  await prisma.periodReview.create({
    data: {
      title: label,
      periodStart: start,
      periodEnd: end,
      category: "Week",
      notes: aiSummary,
      isDraft: true,
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

  const { stats, tiltmeter } = await computePeriodSummary(
    review.periodStart,
    review.periodEnd,
  );

  return { ...review, stats, tiltmeter };
}

export type ReviewsData = Awaited<ReturnType<typeof getReviewsData>>;
export type ReviewDetail = Awaited<ReturnType<typeof getReviewDetail>>;

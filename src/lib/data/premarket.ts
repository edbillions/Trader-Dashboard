import { prisma } from "@/lib/prisma";
import { computeLearningSystemStats } from "@/lib/domain/premarket";
import { ACTIVE_INSTRUMENTS } from "@/lib/premarket/instruments";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateKeyOf(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function getAnalysesForDate(date: Date, instrumentFilter?: string[]) {
  return prisma.preMarketAnalysis.findMany({
    where: instrumentFilter ? { date, instrument: { in: instrumentFilter } } : { date },
    include: {
      screenshots: { orderBy: [{ phase: "asc" }, { timeframe: "asc" }] },
      review: true,
    },
    orderBy: { instrument: "asc" },
  });
}

// Today's live view only shows currently-active instruments (see
// ACTIVE_INSTRUMENTS) — e.g. a leftover ES row from before ES was disabled
// won't reappear here. History/detail pages stay unfiltered since they're a
// read-only record of whatever actually ran that day.
export async function getTodayPreMarketState() {
  const today = new Date(`${todayKey()}T00:00:00`);
  const analyses = await getAnalysesForDate(today, ACTIVE_INSTRUMENTS);
  return { date: todayKey(), analyses };
}

export async function getPreMarketDayDetail(date: string) {
  const dateOnly = new Date(`${date}T00:00:00`);
  const analyses = await getAnalysesForDate(dateOnly);
  if (analyses.length === 0) return null;
  return { date, analyses };
}

export async function listPreMarketDays(limit = 30) {
  const analyses = await prisma.preMarketAnalysis.findMany({
    orderBy: { date: "desc" },
    take: limit * 2, // up to 2 instruments/day
    include: { review: { select: { overallAccuracyScore: true } } },
  });

  const byDate = new Map<string, typeof analyses>();
  for (const a of analyses) {
    const key = dateKeyOf(a.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(a);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, limit)
    .map(([date, rows]) => ({
      date,
      instruments: rows.map((r) => ({
        instrument: r.instrument,
        overallBias: r.overallBias,
        tradeable: r.tradeable,
        confidence: r.biasConfidence,
        accuracyScore: r.review?.overallAccuracyScore ?? null,
      })),
    }));
}

const DEFAULT_WINDOW_DAYS = 30;

export async function getLearningSystemStats(
  windowDays: number = DEFAULT_WINDOW_DAYS,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);

  const reviews = await prisma.preMarketReview.findMany({
    where: { analysis: { date: { gte: cutoff } } },
    include: { analysis: { select: { instrument: true, date: true } } },
    orderBy: { analysis: { date: "asc" } },
  });

  const instruments = Array.from(new Set(reviews.map((r) => r.analysis.instrument))).sort();

  const perInstrument = instruments.map((instrument) =>
    computeLearningSystemStats(
      instrument,
      windowDays,
      reviews.filter((r) => r.analysis.instrument === instrument),
    ),
  );

  const trend = reviews.map((r) => ({
    date: dateKeyOf(r.analysis.date),
    instrument: r.analysis.instrument,
    biasAccuracyScore: r.biasAccuracyScore,
    liquidityAccuracyScore: r.liquidityAccuracyScore,
    fvgAccuracyScore: r.fvgAccuracyScore,
    targetAccuracyScore: r.targetAccuracyScore,
    narrativeAccuracyScore: r.narrativeAccuracyScore,
    overallAccuracyScore: r.overallAccuracyScore,
  }));

  return { windowDays, perInstrument, trend };
}

export type TodayPreMarketState = Awaited<ReturnType<typeof getTodayPreMarketState>>;
export type PreMarketDayDetail = Awaited<ReturnType<typeof getPreMarketDayDetail>>;
export type PreMarketDaysList = Awaited<ReturnType<typeof listPreMarketDays>>;
export type LearningSystemStatsResult = Awaited<ReturnType<typeof getLearningSystemStats>>;

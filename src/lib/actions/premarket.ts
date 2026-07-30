"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { runPreMarketAnalysisForInstrument } from "@/lib/premarket/run-analysis";
import { runDailyReviewForInstrument } from "@/lib/premarket/run-review";
import { parsePreMarketChecklist } from "@/lib/types/premarket-checklist";
import type { Instrument } from "@/lib/ai/premarket-analysis";

const INSTRUMENTS: Instrument[] = ["NQ", "ES"];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

export async function runPreMarketAnalysisAction() {
  const today = new Date(`${todayKey()}T00:00:00`);

  const outcomes = await Promise.all(
    INSTRUMENTS.map(async (instrument) => ({
      instrument,
      result: await runPreMarketAnalysisForInstrument(instrument),
    })),
  );

  for (const { instrument, result } of outcomes) {
    if (!result) continue;
    const { screenshots, ictRead, synthesis } = result;

    await prisma.$transaction(async (tx) => {
      const analysis = await tx.preMarketAnalysis.upsert({
        where: { date_instrument: { date: today, instrument } },
        update: {
          htfBiasAnalysis: JSON.stringify(ictRead.htfBias),
          htfBiasConfidence: ictRead.htfBias.confidence,
          liquidityAnalysis: JSON.stringify(ictRead.liquidity),
          fvgAnalysis: JSON.stringify(ictRead.fairValueGaps),
          premiumDiscountZone: ictRead.premiumDiscount.zone,
          premiumDiscountNotes: ictRead.premiumDiscount.currentPriceContext,
          bullishPct: synthesis.bullishPct,
          bearishPct: synthesis.bearishPct,
          rangePct: synthesis.rangePct,
          overallBias: synthesis.overallBias,
          biasConfidence: synthesis.confidence,
          biasReasoning: synthesis.reasoning,
          expectedNarrative: synthesis.expectedNarrative,
          invalidationLevel: synthesis.invalidationLevel,
          primaryTarget: synthesis.primaryTarget,
          secondaryTarget: synthesis.secondaryTarget,
          tradeable: synthesis.tradeable,
          noTradeReason: synthesis.tradeable ? null : synthesis.noTradeReason,
          tradeScenarios: JSON.stringify(synthesis.scenarios),
        },
        create: {
          date: today,
          instrument,
          htfBiasAnalysis: JSON.stringify(ictRead.htfBias),
          htfBiasConfidence: ictRead.htfBias.confidence,
          liquidityAnalysis: JSON.stringify(ictRead.liquidity),
          fvgAnalysis: JSON.stringify(ictRead.fairValueGaps),
          premiumDiscountZone: ictRead.premiumDiscount.zone,
          premiumDiscountNotes: ictRead.premiumDiscount.currentPriceContext,
          bullishPct: synthesis.bullishPct,
          bearishPct: synthesis.bearishPct,
          rangePct: synthesis.rangePct,
          overallBias: synthesis.overallBias,
          biasConfidence: synthesis.confidence,
          biasReasoning: synthesis.reasoning,
          expectedNarrative: synthesis.expectedNarrative,
          invalidationLevel: synthesis.invalidationLevel,
          primaryTarget: synthesis.primaryTarget,
          secondaryTarget: synthesis.secondaryTarget,
          tradeable: synthesis.tradeable,
          noTradeReason: synthesis.tradeable ? null : synthesis.noTradeReason,
          tradeScenarios: JSON.stringify(synthesis.scenarios),
        },
      });

      // Re-running the button re-captures fresh morning screenshots — replace
      // only this phase's screenshots, leaving any existing EOD ones alone.
      await tx.preMarketScreenshot.deleteMany({
        where: { analysisId: analysis.id, phase: "morning" },
      });
      await tx.preMarketScreenshot.createMany({
        data: screenshots.map((s) => ({
          analysisId: analysis.id,
          instrument,
          timeframe: s.timeframe,
          phase: "morning" as const,
          filePath: s.filePath,
        })),
      });
    });
  }

  revalidatePath("/premarket");
  revalidatePath(`/premarket/${todayKey()}`);
  revalidatePath("/dashboard");

  const failed = outcomes.filter((o) => !o.result).map((o) => o.instrument);
  return { ok: failed.length < INSTRUMENTS.length, failed };
}

export async function runDailyReviewAction() {
  const today = new Date(`${todayKey()}T00:00:00`);

  const analyses = await prisma.preMarketAnalysis.findMany({
    where: { date: today },
    include: { review: true },
  });

  const outcomes = await Promise.all(
    analyses
      .filter((a) => !a.review)
      .map(async (a) => {
        const result = await runDailyReviewForInstrument(a.instrument as Instrument, {
          overallBias: a.overallBias,
          biasReasoning: a.biasReasoning,
          expectedNarrative: a.expectedNarrative,
          invalidationLevel: a.invalidationLevel,
          primaryTarget: a.primaryTarget,
          secondaryTarget: a.secondaryTarget,
          tradeable: a.tradeable,
          noTradeReason: a.noTradeReason,
        });
        return { analysis: a, result };
      }),
  );

  for (const { analysis, result } of outcomes) {
    if (!result) continue;
    const { screenshots, grading } = result;

    await prisma.$transaction(async (tx) => {
      await tx.preMarketReview.upsert({
        where: { analysisId: analysis.id },
        update: grading,
        create: { analysisId: analysis.id, ...grading },
      });

      await tx.preMarketScreenshot.deleteMany({
        where: { analysisId: analysis.id, phase: "eod" },
      });
      await tx.preMarketScreenshot.createMany({
        data: screenshots.map((s) => ({
          analysisId: analysis.id,
          instrument: analysis.instrument,
          timeframe: s.timeframe,
          phase: "eod" as const,
          filePath: s.filePath,
        })),
      });
    });
  }

  revalidatePath("/premarket");
  revalidatePath(`/premarket/${todayKey()}`);
  revalidatePath("/premarket/learning");

  const failed = outcomes.filter((o) => !o.result).map((o) => o.analysis.instrument);
  return { ok: failed.length < outcomes.length || outcomes.length === 0, failed };
}

// Maps the AI analysis onto the existing Journal Pre-Market Plan step —
// touches only htfBias/keyLevels and the biasDirection/dailyRangeLocation
// fields of preMarketChecklist, leaving trades, screenshots, and the
// drawOnLiquidity checklist (the user's own manual verification ritual)
// completely untouched. Idempotent, re-clickable.
export async function pullIntoJournalPlanAction(formData: FormData) {
  const analysisId = requiredString(formData, "analysisId");

  const analysis = await prisma.preMarketAnalysis.findUnique({
    where: { id: analysisId },
  });
  if (!analysis) throw new Error("Analysis not found");

  const dateKey = analysis.date.toISOString().slice(0, 10);

  const existingDay = await prisma.tradingDay.findUnique({
    where: { date: analysis.date },
  });
  const existingChecklist = parsePreMarketChecklist(
    existingDay?.preMarketChecklist ?? null,
  );

  const biasDirection: "bullish" | "bearish" | "neutral" =
    analysis.overallBias === "bullish" || analysis.overallBias === "bearish"
      ? analysis.overallBias
      : "neutral";
  const dailyRangeLocation = analysis.premiumDiscountZone as
    | "premium"
    | "discount"
    | "equilibrium";

  const updatedChecklist = {
    ...existingChecklist,
    biasDirection,
    dailyRangeLocation,
  };

  const htfBias = `[${analysis.instrument} AI analysis] ${analysis.biasReasoning}`;
  const keyLevels =
    `Invalidation: ${analysis.invalidationLevel} · ` +
    `Primary target: ${analysis.primaryTarget} · ` +
    `Secondary target: ${analysis.secondaryTarget}`;

  await prisma.tradingDay.upsert({
    where: { date: analysis.date },
    update: {
      htfBias,
      keyLevels,
      preMarketChecklist: JSON.stringify(updatedChecklist),
    },
    create: {
      date: analysis.date,
      htfBias,
      keyLevels,
      preMarketChecklist: JSON.stringify(updatedChecklist),
    },
  });

  revalidatePath(`/journal/${dateKey}`);
  revalidatePath("/journal/new");
  revalidatePath("/journal");
}

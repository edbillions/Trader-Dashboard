"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { findOrCreateTradingDay, getTradingDayDetail } from "@/lib/data/trading-day";
import { detectTiltSignals } from "@/lib/domain/tilt";
import { computeAutoScorecard } from "@/lib/domain/auto-scorecard";

const EMERGENCY_PAUSE_MINUTES = 15;

function revalidateLiveSession(dateKey: string) {
  revalidatePath("/live-session");
  revalidatePath(`/live-session/recap/${dateKey}`);
  revalidatePath(`/journal/${dateKey}`);
  revalidatePath("/dashboard");
}

function formatQuickLogWriteup(input: { setup?: string; emotionTag?: string }): string {
  const parts: string[] = ["Quick logged from Live Session — needs fleshing out."];
  if (input.setup) parts.push(`Setup: ${input.setup}`);
  if (input.emotionTag) parts.push(`Emotion: ${input.emotionTag}`);
  return parts.join(" ");
}

export interface QuickLogInput {
  dateKey: string;
  outcome: "win" | "loss" | "be";
  amount: number; // dollars, unsigned; ignored for "be"
  instrument: string;
  direction: "long" | "short";
  setup?: string;
  emotionTag?: string;
}

export async function quickLogTradeAction(
  input: QuickLogInput,
): Promise<{ tradeId: string }> {
  const day = await findOrCreateTradingDay(input.dateKey);

  if (day.sessionEndedAt) {
    throw new Error("Session has already ended for today — no more trades can be logged.");
  }

  const signedAmount =
    input.outcome === "loss"
      ? -Math.abs(input.amount)
      : input.outcome === "win"
        ? Math.abs(input.amount)
        : 0;

  const now = new Date();

  const trade = await prisma.trade.create({
    data: {
      tradingDayId: day.id,
      symbol: input.instrument,
      direction: input.direction,
      entryPrice: 0,
      exitPrice: 0,
      positionSize: 1,
      entryTime: now,
      exitTime: now,
      netPnl: signedAmount,
      grossPnl: signedAmount,
      writeup: formatQuickLogWriteup({ setup: input.setup, emotionTag: input.emotionTag }),
      quickLogged: true,
    },
  });

  revalidateLiveSession(input.dateKey);

  return { tradeId: trade.id };
}

export async function triggerEmergencyPauseAction(
  dateKey: string,
): Promise<{ pausedUntil: string }> {
  const day = await findOrCreateTradingDay(dateKey);
  const pausedUntil = new Date(Date.now() + EMERGENCY_PAUSE_MINUTES * 60_000);

  await prisma.tradingDay.update({
    where: { id: day.id },
    data: { emergencyPauseUntil: pausedUntil },
  });

  revalidateLiveSession(dateKey);

  return { pausedUntil: pausedUntil.toISOString() };
}

export async function endSessionAction(dateKey: string): Promise<{ date: string }> {
  const day = await findOrCreateTradingDay(dateKey);
  const detail = await getTradingDayDetail(dateKey);

  if (detail && detail.scorecard == null) {
    const tiltSignals = detectTiltSignals({
      date: dateKey,
      maxTradeCountPlan: detail.maxTradeCountPlan,
      sessionTiming: detail.sessionTiming,
      trades: detail.trades.map((t) => ({
        id: t.id,
        entryTime: t.entryTime,
        exitTime: t.exitTime,
        positionSize: t.positionSize,
        netPnl: t.netPnl,
        session: t.session,
      })),
    });

    const lossUsedToday = Math.abs(
      detail.trades
        .map((t) => t.netPnl ?? 0)
        .filter((pnl) => pnl < 0)
        .reduce((a, b) => a + b, 0),
    );

    const hasPreMarketPlan = Boolean(
      (detail.htfBias && detail.htfBias.trim()) ||
        (detail.keyLevels && detail.keyLevels.trim()) ||
        detail.preMarketChecklist,
    );
    const debriefFilled = Boolean(
      (detail.debriefImprovement && detail.debriefImprovement.trim()) ||
        (detail.debriefFeeling && detail.debriefFeeling.trim()),
    );

    const autoScorecard = computeAutoScorecard({
      tiltSignals,
      maxLossPlan: detail.maxLossPlan,
      maxTradeCountPlan: detail.maxTradeCountPlan,
      lossUsedToday,
      tradesTakenToday: detail.trades.length,
      emergencyPauseUsed: Boolean(detail.emergencyPauseUntil),
      sessionEndedVoluntarily: true,
      hasPreMarketPlan,
      debriefFilled,
    });

    await prisma.tradingDay.update({
      where: { id: day.id },
      data: { scorecard: JSON.stringify(autoScorecard), sessionEndedAt: new Date() },
    });
  } else {
    await prisma.tradingDay.update({
      where: { id: day.id },
      data: { sessionEndedAt: new Date() },
    });
  }

  revalidateLiveSession(dateKey);

  return { date: dateKey };
}

export async function saveDebriefAction(
  dateKey: string,
  improvement: string,
  feeling: string,
): Promise<void> {
  const day = await findOrCreateTradingDay(dateKey);
  await prisma.tradingDay.update({
    where: { id: day.id },
    data: {
      debriefImprovement: improvement.trim() || null,
      debriefFeeling: feeling.trim() || null,
    },
  });
  revalidatePath(`/live-session/recap/${dateKey}`);
}

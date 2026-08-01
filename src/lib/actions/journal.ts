"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateTrade } from "@/lib/pnl";
import { getTradingDayDetail } from "@/lib/data/trading-day";
import { getTradeDetail } from "@/lib/data/trades";
import { summarizeTradingDay } from "@/lib/ai/summarize";
import {
  generateTradeSmartReview,
  buildTradeSmartReviewInput,
} from "@/lib/ai/trade-smart-review";
import type { SaveTradingDayInput } from "@/lib/types/journal";

export async function uploadScreenshotAction(
  formData: FormData,
): Promise<{ path: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }

  const folder = formData.get("folder");
  const subdir = folder === "plans" ? "plans" : "trades";

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".png";
  const filename = `${randomUUID()}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), bytes);

  return { path: `/uploads/${subdir}/${filename}` };
}

export async function saveTradingDayAction(
  input: SaveTradingDayInput,
): Promise<{ id: string; date: string }> {
  if (!input.date) {
    throw new Error("Date is required");
  }

  const dateOnly = new Date(`${input.date}T00:00:00`);

  const instruments = await prisma.instrumentConfig.findMany();
  const instrumentBySymbol = new Map(
    instruments.map((i) => [i.symbol.toUpperCase(), i]),
  );

  const tradingDay = await prisma.$transaction(async (tx) => {
    const day = await tx.tradingDay.upsert({
      where: { date: dateOnly },
      update: {
        htfBias: input.htfBias || null,
        keyLevels: input.keyLevels || null,
        sessionTiming: input.sessionTiming || null,
        news: input.news || null,
        maxLossPlan: input.maxLossPlan,
        positionSizePlan: input.positionSizePlan || null,
        maxTradeCountPlan: input.maxTradeCountPlan,
        preMarketChecklist: JSON.stringify(input.preMarketChecklist),
        planAdherenceGrade: input.planAdherenceGrade || null,
        psychologyLog: input.psychologyLog || null,
        freeformNotes: input.freeformNotes || null,
        scorecard: JSON.stringify(input.scorecard),
        ruleViolations: {
          set: input.ruleViolationIds.map((id) => ({ id })),
        },
      },
      create: {
        date: dateOnly,
        htfBias: input.htfBias || null,
        keyLevels: input.keyLevels || null,
        sessionTiming: input.sessionTiming || null,
        news: input.news || null,
        maxLossPlan: input.maxLossPlan,
        positionSizePlan: input.positionSizePlan || null,
        maxTradeCountPlan: input.maxTradeCountPlan,
        preMarketChecklist: JSON.stringify(input.preMarketChecklist),
        planAdherenceGrade: input.planAdherenceGrade || null,
        psychologyLog: input.psychologyLog || null,
        freeformNotes: input.freeformNotes || null,
        scorecard: JSON.stringify(input.scorecard),
        ruleViolations: {
          connect: input.ruleViolationIds.map((id) => ({ id })),
        },
      },
    });

    // Replace trades, missed trades, and plan screenshots wholesale for this
    // day, since the journal wizard always submits the day's complete,
    // authoritative state.
    await tx.trade.deleteMany({ where: { tradingDayId: day.id } });
    await tx.missedTrade.deleteMany({ where: { tradingDayId: day.id } });
    await tx.tradingDayScreenshot.deleteMany({
      where: { tradingDayId: day.id },
    });

    if (input.planScreenshotPaths.length > 0) {
      await tx.tradingDayScreenshot.createMany({
        data: input.planScreenshotPaths.map((filePath) => ({
          tradingDayId: day.id,
          filePath,
        })),
      });
    }

    for (const trade of input.trades) {
      const instrument = instrumentBySymbol.get(trade.symbol.toUpperCase());
      const calc = calculateTrade({
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        positionSize: trade.positionSize,
        commission: trade.commission,
        stopLossPlanned: trade.stopLossPlanned,
        entryTime: trade.entryTime,
        exitTime: trade.exitTime,
        instrument: instrument
          ? { tickValue: instrument.tickValue, tickSize: instrument.tickSize }
          : null,
      });

      const created = await tx.trade.create({
        data: {
          tradingDayId: day.id,
          accountId: trade.accountId || null,
          symbol: trade.symbol.toUpperCase(),
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          entryTime: new Date(trade.entryTime),
          exitTime: trade.exitTime ? new Date(trade.exitTime) : null,
          stopLossPlanned: trade.stopLossPlanned,
          stopLossActual: trade.stopLossActual,
          targetPlanned: trade.targetPlanned,
          targetActual: trade.targetActual,
          positionSize: trade.positionSize,
          commission: trade.commission,
          grossPnl: calc.grossPnl,
          netPnl: calc.netPnl,
          rMultiple: calc.rMultiple,
          htfChartLink: trade.htfChartLink || null,
          intermediateChartLink: trade.intermediateChartLink || null,
          entryChartLink: trade.entryChartLink || null,
          entryTimeframe: trade.entryTimeframe || null,
          entryModel: trade.entryModel || null,
          session: trade.session || null,
          setupGrade: trade.setupGrade || null,
          dailyBias: trade.dailyBias || null,
          htfPoi: trade.htfPoi || null,
          htfDol: trade.htfDol || null,
          setupFactorsChecklist: JSON.stringify(trade.setupFactors),
          mfeR: trade.mfeR,
          maeR: trade.maeR,
          writeup: trade.writeup || null,
          confluenceFactors: {
            connect: trade.confluenceFactorIds.map((id) => ({ id })),
          },
          mistakes: {
            connect: trade.mistakeIds.map((id) => ({ id })),
          },
          tags: {
            connect: trade.tagIds.map((id) => ({ id })),
          },
        },
      });

      if (trade.screenshotPaths.length > 0) {
        await tx.screenshot.createMany({
          data: trade.screenshotPaths.map((filePath) => ({
            tradeId: created.id,
            filePath,
          })),
        });
      }
    }

    for (const missed of input.missedTrades) {
      if (!missed.symbol) continue;
      await tx.missedTrade.create({
        data: {
          tradingDayId: day.id,
          symbol: missed.symbol.toUpperCase(),
          setupDescription: missed.setupDescription || null,
          reasonMissed: missed.reasonMissed || null,
          entryModel: missed.entryModel || null,
          session: missed.session || null,
          estimatedRMultiple: missed.estimatedRMultiple,
          confluenceFactors: {
            connect: missed.confluenceFactorIds.map((id) => ({ id })),
          },
          tags: {
            connect: missed.tagIds.map((id) => ({ id })),
          },
        },
      });
    }

    return day;
  });

  try {
    const detail = await getTradingDayDetail(input.date);
    if (detail) {
      const summary = await summarizeTradingDay(detail);
      if (summary) {
        await prisma.tradingDay.update({
          where: { id: tradingDay.id },
          data: { aiSummary: summary },
        });
      }

      await Promise.all(
        detail.trades.map(async (trade) => {
          const review = await generateTradeSmartReview(
            buildTradeSmartReviewInput(trade, detail.date),
          );
          if (review) {
            await prisma.trade.update({
              where: { id: trade.id },
              data: { smartReview: JSON.stringify(review) },
            });
          }
        }),
      );
    }
  } catch (error) {
    console.error("AI summary failed:", error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/trades");
  revalidatePath("/calendar");
  revalidatePath(`/journal/${input.date}`);

  return { id: tradingDay.id, date: input.date };
}

export async function generateTradeSmartReviewAction(
  tradeId: string,
): Promise<{ available: boolean }> {
  const trade = await getTradeDetail(tradeId);
  if (!trade) return { available: false };

  const review = await generateTradeSmartReview(
    buildTradeSmartReviewInput(trade, trade.tradingDay.date),
  );
  if (!review) return { available: false };

  await prisma.trade.update({
    where: { id: tradeId },
    data: { smartReview: JSON.stringify(review) },
  });

  revalidatePath(`/trades/${tradeId}`);
  return { available: true };
}

export async function saveTradingDayAndRedirectAction(
  input: SaveTradingDayInput,
) {
  const result = await saveTradingDayAction(input);
  redirect(`/journal/${result.date}`);
}

export async function deleteTradingDayAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("Missing trading day id");
  }

  await prisma.tradingDay.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/trades");
  revalidatePath("/calendar");

  redirect("/journal");
}

export async function deleteTradeAction(formData: FormData) {
  const id = formData.get("id");
  const date = formData.get("date");
  if (typeof id !== "string") {
    throw new Error("Missing trade id");
  }

  await prisma.trade.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/trades");
  revalidatePath("/calendar");
  if (typeof date === "string") {
    revalidatePath(`/journal/${date}`);
  }
}

export async function bulkDeleteTradesAction(
  ids: string[],
): Promise<{ deletedCount: number }> {
  if (ids.length === 0) return { deletedCount: 0 };

  const trades = await prisma.trade.findMany({
    where: { id: { in: ids } },
    select: { tradingDay: { select: { date: true } } },
  });
  const dateKeys = new Set(
    trades.map((t) => t.tradingDay.date.toISOString().slice(0, 10)),
  );

  const result = await prisma.trade.deleteMany({ where: { id: { in: ids } } });

  revalidatePath("/dashboard");
  revalidatePath("/trades");
  revalidatePath("/calendar");
  for (const dateKey of dateKeys) {
    revalidatePath(`/journal/${dateKey}`);
  }

  return { deletedCount: result.count };
}

export async function bulkTagTradesAction(
  tradeIds: string[],
  tagIds: string[],
): Promise<{ updatedCount: number }> {
  if (tradeIds.length === 0 || tagIds.length === 0) return { updatedCount: 0 };

  // Tags follow a one-per-category invariant per trade (see TagCategoryPicker),
  // so applying a tag from a category replaces whatever that trade already
  // had selected in that same category, rather than piling up alongside it.
  const selectedTags = await prisma.tagOption.findMany({
    where: { id: { in: tagIds } },
    select: { categoryId: true },
  });
  const touchedCategoryIds = Array.from(
    new Set(selectedTags.map((t) => t.categoryId)),
  );
  const categoryTags = await prisma.tagOption.findMany({
    where: { categoryId: { in: touchedCategoryIds } },
    select: { id: true },
  });

  await prisma.$transaction(
    tradeIds.map((id) =>
      prisma.trade.update({
        where: { id },
        data: {
          tags: {
            disconnect: categoryTags.map((t) => ({ id: t.id })),
            connect: tagIds.map((id) => ({ id })),
          },
        },
      }),
    ),
  );

  revalidatePath("/dashboard");
  revalidatePath("/trades");
  revalidatePath("/calendar");

  return { updatedCount: tradeIds.length };
}

export async function clearPreMarketPlanAction(formData: FormData) {
  const id = formData.get("id");
  const date = formData.get("date");
  if (typeof id !== "string") {
    throw new Error("Missing trading day id");
  }

  await prisma.$transaction([
    prisma.tradingDayScreenshot.deleteMany({ where: { tradingDayId: id } }),
    prisma.tradingDay.update({
      where: { id },
      data: {
        htfBias: null,
        keyLevels: null,
        sessionTiming: null,
        news: null,
        maxLossPlan: null,
        positionSizePlan: null,
        maxTradeCountPlan: null,
        preMarketChecklist: null,
      },
    }),
  ]);

  revalidatePath("/dashboard");
  if (typeof date === "string") {
    revalidatePath(`/journal/${date}`);
  }
}

export async function clearPostSessionReviewAction(formData: FormData) {
  const id = formData.get("id");
  const date = formData.get("date");
  if (typeof id !== "string") {
    throw new Error("Missing trading day id");
  }

  await prisma.tradingDay.update({
    where: { id },
    data: {
      planAdherenceGrade: null,
      psychologyLog: null,
      freeformNotes: null,
      scorecard: null,
      ruleViolations: { set: [] },
    },
  });

  revalidatePath("/dashboard");
  if (typeof date === "string") {
    revalidatePath(`/journal/${date}`);
  }
}

export async function deleteMissedTradeAction(formData: FormData) {
  const id = formData.get("id");
  const date = formData.get("date");
  if (typeof id !== "string") {
    throw new Error("Missing missed trade id");
  }

  await prisma.missedTrade.delete({ where: { id } });

  revalidatePath("/dashboard");
  if (typeof date === "string") {
    revalidatePath(`/journal/${date}`);
  }
}

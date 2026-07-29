"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateTrade } from "@/lib/pnl";
import { getTradingDayDetail } from "@/lib/data/trading-day";
import { summarizeTradingDay } from "@/lib/ai/summarize";
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
        planAdherenceGrade: input.planAdherenceGrade || null,
        psychologyLog: input.psychologyLog || null,
        freeformNotes: input.freeformNotes || null,
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
        planAdherenceGrade: input.planAdherenceGrade || null,
        psychologyLog: input.psychologyLog || null,
        freeformNotes: input.freeformNotes || null,
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
          htfTimeframe: trade.htfTimeframe || null,
          intermediateTimeframe: trade.intermediateTimeframe || null,
          entryTimeframe: trade.entryTimeframe || null,
          entryModel: trade.entryModel || null,
          session: trade.session || null,
          setupGrade: trade.setupGrade || null,
          dailyBias: trade.dailyBias || null,
          htfPoi: trade.htfPoi || null,
          htfDol: trade.htfDol || null,
          writeup: trade.writeup || null,
          confluenceFactors: {
            connect: trade.confluenceFactorIds.map((id) => ({ id })),
          },
          mistakes: {
            connect: trade.mistakeIds.map((id) => ({ id })),
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
          confluenceFactors: {
            connect: missed.confluenceFactorIds.map((id) => ({ id })),
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

export async function saveTradingDayAndRedirectAction(
  input: SaveTradingDayInput,
) {
  const result = await saveTradingDayAction(input);
  redirect(`/journal/${result.date}`);
}

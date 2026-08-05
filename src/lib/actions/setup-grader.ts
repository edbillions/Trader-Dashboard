"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { findOrCreateTradingDay } from "@/lib/data/trading-day";

// Plain-arg actions (client-tap-triggered, not FormData submits) — matches
// saveDebriefAction's shape in src/lib/actions/live-session.ts.

export async function addSetupGraderNoteAction(
  dateKey: string,
  text: string,
): Promise<{ id: string; text: string; createdAtIso: string }> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Note text is required");

  const day = await findOrCreateTradingDay(dateKey);
  const note = await prisma.setupGraderNote.create({
    data: { tradingDayId: day.id, text: trimmed },
  });

  revalidatePath("/setup-grader");

  return { id: note.id, text: note.text, createdAtIso: note.createdAt.toISOString() };
}

export async function deleteSetupGraderNoteAction(id: string): Promise<void> {
  await prisma.setupGraderNote.delete({ where: { id } });
  revalidatePath("/setup-grader");
}

export async function setSetupGraderBiasAction(
  dateKey: string,
  bias: "bullish" | "bearish" | "neutral",
): Promise<void> {
  const day = await findOrCreateTradingDay(dateKey);
  await prisma.tradingDay.update({
    where: { id: day.id },
    data: { graderBias: bias },
  });
  revalidatePath("/setup-grader");
}

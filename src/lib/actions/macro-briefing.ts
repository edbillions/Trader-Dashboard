"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateMacroBriefing } from "@/lib/ai/macro-briefing";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function generateMacroBriefingAction() {
  const result = await generateMacroBriefing();
  if (!result) {
    return { available: false as const };
  }

  const today = todayKey();
  await prisma.macroBriefing.upsert({
    where: { date: new Date(`${today}T00:00:00`) },
    update: {
      asOf: result.asOf,
      macroTone: result.macroTone,
      economicCalendarToday: JSON.stringify(result.economicCalendarToday),
      weekAhead: JSON.stringify(result.weekAhead),
      trumpAppearancesToday: JSON.stringify(result.trumpAppearancesToday),
    },
    create: {
      date: new Date(`${today}T00:00:00`),
      asOf: result.asOf,
      macroTone: result.macroTone,
      economicCalendarToday: JSON.stringify(result.economicCalendarToday),
      weekAhead: JSON.stringify(result.weekAhead),
      trumpAppearancesToday: JSON.stringify(result.trumpAppearancesToday),
    },
  });

  revalidatePath("/dashboard");
  return { available: true as const };
}

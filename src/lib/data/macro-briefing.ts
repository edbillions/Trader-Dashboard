import { prisma } from "@/lib/prisma";
import {
  parseEconomicCalendar,
  parseWeekAhead,
} from "@/lib/types/macro-briefing";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayMacroBriefing() {
  const today = todayKey();
  const briefing = await prisma.macroBriefing.findUnique({
    where: { date: new Date(`${today}T00:00:00`) },
  });

  if (!briefing) return null;

  return {
    asOf: briefing.asOf,
    macroTone: briefing.macroTone,
    economicCalendarToday: parseEconomicCalendar(briefing.economicCalendarToday),
    weekAhead: parseWeekAhead(briefing.weekAhead),
    generatedAt: briefing.createdAt.toISOString(),
  };
}

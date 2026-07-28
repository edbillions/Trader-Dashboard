import { prisma } from "@/lib/prisma";
import { computeDayDisciplineScore } from "@/lib/domain/discipline";

export async function getCalendarMonth(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const days = await prisma.tradingDay.findMany({
    where: { date: { gte: start, lt: end } },
    include: {
      ruleViolations: { select: { id: true } },
      trades: { select: { netPnl: true, rMultiple: true, setupGrade: true } },
    },
  });

  return days.map((day) => {
    const netPnl = day.trades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
    const netR = day.trades.reduce((s, t) => s + (t.rMultiple ?? 0), 0);
    const disciplineScore = computeDayDisciplineScore({
      planAdherenceGrade: day.planAdherenceGrade,
      maxLossPlan: day.maxLossPlan,
      ruleViolationCount: day.ruleViolations.length,
      trades: day.trades,
    });

    return {
      date: day.date.toISOString().slice(0, 10),
      tradeCount: day.trades.length,
      netPnl,
      netR,
      disciplineScore,
    };
  });
}

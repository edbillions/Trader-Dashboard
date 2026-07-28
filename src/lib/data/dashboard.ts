import { prisma } from "@/lib/prisma";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboardData() {
  const today = todayKey();
  const todayDate = new Date(`${today}T00:00:00`);

  const [todayEntry, recentDays, allTrades] = await Promise.all([
    prisma.tradingDay.findUnique({ where: { date: todayDate } }),
    prisma.tradingDay.findMany({
      orderBy: { date: "desc" },
      take: 7,
      include: { trades: { select: { netPnl: true } } },
    }),
    prisma.trade.findMany({ select: { netPnl: true } }),
  ]);

  const netPnl = allTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
  const wins = allTrades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losses = allTrades.filter((t) => (t.netPnl ?? 0) < 0).length;
  const winRate =
    wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;

  return {
    hasLoggedToday: Boolean(todayEntry),
    today,
    totalTrades: allTrades.length,
    netPnl,
    winRate,
    recentDays: recentDays.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      tradeCount: d.trades.length,
      netPnl: d.trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0),
    })),
  };
}

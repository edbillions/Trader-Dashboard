import { prisma } from "@/lib/prisma";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboardData() {
  const today = todayKey();
  const todayDate = new Date(`${today}T00:00:00`);

  const [todayEntry, recentDays, allTrades] = await Promise.all([
    prisma.tradingDay.findUnique({
      where: { date: todayDate },
      include: {
        trades: {
          select: { id: true, symbol: true, netPnl: true, setupGrade: true },
          orderBy: { entryTime: "asc" },
        },
      },
    }),
    prisma.tradingDay.findMany({
      orderBy: { date: "desc" },
      take: 7,
      include: {
        trades: {
          select: { symbol: true, netPnl: true, rMultiple: true, setupGrade: true },
        },
      },
    }),
    prisma.trade.findMany({ select: { netPnl: true } }),
  ]);

  const netPnl = allTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
  const wins = allTrades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losses = allTrades.filter((t) => (t.netPnl ?? 0) < 0).length;
  const winRate =
    wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;

  const todayWins =
    todayEntry?.trades.filter((t) => (t.netPnl ?? 0) > 0).length ?? 0;
  const todayLosses =
    todayEntry?.trades.filter((t) => (t.netPnl ?? 0) < 0).length ?? 0;
  const todayNetPnl =
    todayEntry?.trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0) ?? 0;

  return {
    hasLoggedToday: Boolean(todayEntry),
    today,
    totalTrades: allTrades.length,
    netPnl,
    winRate,
    todaySummary: todayEntry
      ? {
          tradeCount: todayEntry.trades.length,
          wins: todayWins,
          losses: todayLosses,
          winRate:
            todayWins + todayLosses > 0
              ? (todayWins / (todayWins + todayLosses)) * 100
              : null,
          netPnl: todayNetPnl,
          takeaway: todayEntry.freeformNotes,
          trades: todayEntry.trades.map((t) => ({
            id: t.id,
            symbol: t.symbol,
            netPnl: t.netPnl,
            setupGrade: t.setupGrade,
          })),
        }
      : null,
    recentDays: recentDays.map((d) => {
      const dayWins = d.trades.filter((t) => (t.netPnl ?? 0) > 0).length;
      const dayLosses = d.trades.filter((t) => (t.netPnl ?? 0) < 0).length;
      const rValues = d.trades
        .map((t) => t.rMultiple)
        .filter((r): r is number => r != null);
      return {
        date: d.date.toISOString().slice(0, 10),
        tradeCount: d.trades.length,
        netPnl: d.trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0),
        wins: dayWins,
        losses: dayLosses,
        totalR:
          rValues.length > 0
            ? rValues.reduce((sum, r) => sum + r, 0)
            : null,
        symbols: Array.from(new Set(d.trades.map((t) => t.symbol))),
        planAdherenceGrade: d.planAdherenceGrade,
      };
    }),
  };
}

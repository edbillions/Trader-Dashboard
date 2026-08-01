import { prisma } from "@/lib/prisma";
import { computeStreak, computeTradeStreaks } from "@/lib/domain/streaks";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboardData() {
  const today = todayKey();
  const todayDate = new Date(`${today}T00:00:00`);

  const [todayEntry, recentDays, allTrades, violationDays] = await Promise.all([
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
          orderBy: { entryTime: "asc" },
        },
      },
    }),
    prisma.trade.findMany({
      select: { netPnl: true, entryTime: true },
      orderBy: { entryTime: "asc" },
    }),
    prisma.tradingDay.findMany({
      select: { date: true, ruleViolations: { select: { id: true } } },
    }),
  ]);

  const violationsByDate = new Map(
    violationDays.map((d) => [d.date.toISOString().slice(0, 10), d]),
  );
  const noRuleBreakStreak = computeStreak(
    violationsByDate,
    (d) => d.ruleViolations.length === 0,
  );
  const tradeStreaks = computeTradeStreaks(allTrades);

  const netPnl = allTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
  const wins = allTrades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losses = allTrades.filter((t) => (t.netPnl ?? 0) < 0).length;
  const winRate =
    wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;

  const dailyPnl = new Map<string, number>();
  for (const t of allTrades) {
    const key = t.entryTime.toISOString().slice(0, 10);
    dailyPnl.set(key, (dailyPnl.get(key) ?? 0) + (t.netPnl ?? 0));
  }
  let cumulative = 0;
  const equityCurve = Array.from(dailyPnl.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => {
      cumulative += pnl;
      return { date, equity: Math.round(cumulative * 100) / 100 };
    });

  const todayWins =
    todayEntry?.trades.filter((t) => (t.netPnl ?? 0) > 0).length ?? 0;
  const todayLosses =
    todayEntry?.trades.filter((t) => (t.netPnl ?? 0) < 0).length ?? 0;
  const todayNetPnl =
    todayEntry?.trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0) ?? 0;

  const todayRisk = todayEntry
    ? {
        maxLossPlan: todayEntry.maxLossPlan,
        lossUsed: todayNetPnl < 0 ? Math.abs(todayNetPnl) : 0,
        maxTradeCountPlan: todayEntry.maxTradeCountPlan,
        tradesTaken: todayEntry.trades.length,
      }
    : null;

  return {
    hasLoggedToday: Boolean(todayEntry),
    today,
    totalTrades: allTrades.length,
    netPnl,
    winRate,
    equityCurve,
    // Raw per-trade P&L, for client-side Daily/Weekly/Monthly/Total
    // period filtering on the equity curve — day-level equityCurve above
    // can't be re-aggregated into a same-day intraday curve.
    equityCurveTrades: allTrades.map((t) => ({
      entryTime: t.entryTime.toISOString(),
      netPnl: t.netPnl ?? 0,
    })),
    noRuleBreakStreak,
    tradeStreaks,
    todayRisk,
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
      // Anchored at 0 — see DaySparkline: every day starts at $0 P&L before
      // the first trade, so even a single trade draws a real two-point line.
      let dayCumulative = 0;
      const series = [
        0,
        ...d.trades.map((t) => {
          dayCumulative += t.netPnl ?? 0;
          return Math.round(dayCumulative * 100) / 100;
        }),
      ];
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
        series,
      };
    }),
  };
}

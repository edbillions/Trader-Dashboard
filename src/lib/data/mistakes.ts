import { prisma } from "@/lib/prisma";
import type { GroupStat } from "@/lib/data/analytics";

export async function getMistakesData() {
  const trades = await prisma.trade.findMany({
    include: { mistakes: true },
    orderBy: { entryTime: "asc" },
  });

  const groups = new Map<string, typeof trades>();
  for (const t of trades) {
    for (const m of t.mistakes) {
      if (!groups.has(m.label)) groups.set(m.label, []);
      groups.get(m.label)!.push(t);
    }
  }

  const byMistake: GroupStat[] = Array.from(groups.entries())
    .map(([label, group]) => {
      const wins = group.filter((t) => (t.netPnl ?? 0) > 0).length;
      const losses = group.filter((t) => (t.netPnl ?? 0) < 0).length;
      const rValues = group
        .map((t) => t.rMultiple)
        .filter((r): r is number => r != null);
      return {
        label,
        count: group.length,
        winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : null,
        netPnl: group.reduce((s, t) => s + (t.netPnl ?? 0), 0),
        avgR:
          rValues.length > 0
            ? rValues.reduce((a, b) => a + b, 0) / rValues.length
            : null,
      };
    })
    .sort((a, b) => b.count - a.count);

  const monthly = new Map<string, number>();
  for (const t of trades) {
    if (t.mistakes.length === 0) continue;
    const key = t.entryTime.toISOString().slice(0, 7);
    monthly.set(key, (monthly.get(key) ?? 0) + t.mistakes.length);
  }
  const trend = Array.from(monthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const tradesWithMistakes = trades.filter((t) => t.mistakes.length > 0).length;
  const mistakeCostTotal = byMistake.reduce(
    (sum, m) => sum + Math.min(0, m.netPnl),
    0,
  );

  return {
    totalTrades: trades.length,
    tradesWithMistakes,
    cleanTrades: trades.length - tradesWithMistakes,
    mistakeCostTotal,
    byMistake,
    trend,
  };
}

export type MistakesData = Awaited<ReturnType<typeof getMistakesData>>;

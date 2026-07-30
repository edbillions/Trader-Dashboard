import { prisma } from "@/lib/prisma";

export async function getMissedTradesData() {
  const missedTrades = await prisma.missedTrade.findMany({
    include: { tradingDay: { select: { date: true } } },
    orderBy: { tradingDay: { date: "asc" } },
  });

  const withEstimate = missedTrades.filter(
    (m) => m.estimatedRMultiple != null,
  );

  const totalEstimatedR = withEstimate.reduce(
    (sum, m) => sum + (m.estimatedRMultiple ?? 0),
    0,
  );
  const avgEstimatedR =
    withEstimate.length > 0 ? totalEstimatedR / withEstimate.length : null;

  let cumulative = 0;
  const cumulativeSeries = withEstimate.map((m) => {
    cumulative += m.estimatedRMultiple ?? 0;
    return {
      date: m.tradingDay.date.toISOString().slice(0, 10),
      cumulativeR: Math.round(cumulative * 100) / 100,
    };
  });

  const reasonGroups = new Map<string, { count: number; totalR: number }>();
  for (const m of withEstimate) {
    const key = m.reasonMissed?.trim() || "Unspecified";
    const existing = reasonGroups.get(key) ?? { count: 0, totalR: 0 };
    existing.count += 1;
    existing.totalR += m.estimatedRMultiple ?? 0;
    reasonGroups.set(key, existing);
  }
  const byReason = Array.from(reasonGroups.entries())
    .map(([label, g]) => ({ label, count: g.count, totalR: g.totalR }))
    .sort((a, b) => b.totalR - a.totalR);

  const list = missedTrades.map((m) => ({
    id: m.id,
    date: m.tradingDay.date.toISOString().slice(0, 10),
    symbol: m.symbol,
    reasonMissed: m.reasonMissed,
    entryModel: m.entryModel,
    estimatedRMultiple: m.estimatedRMultiple,
  }));

  return {
    totalMissed: missedTrades.length,
    sampleSizeWithEstimate: withEstimate.length,
    totalEstimatedR,
    avgEstimatedR,
    cumulativeSeries,
    byReason,
    list,
  };
}

export type MissedTradesData = Awaited<ReturnType<typeof getMissedTradesData>>;

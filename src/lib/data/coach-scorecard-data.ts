import { prisma } from "@/lib/prisma";
import { computeDrawdown } from "@/lib/domain/drawdown";
import { getAnalyticsData } from "@/lib/data/analytics";
import { getCoachData } from "@/lib/data/coach";
import type { ScorecardInput } from "@/lib/ai/coach-scorecard";

async function getAggregateDrawdownPct(): Promise<number | null> {
  const accounts = await prisma.propFirmAccount.findMany({
    where: { startingBalance: { not: null } },
    select: {
      startingBalance: true,
      trades: {
        select: { entryTime: true, netPnl: true },
        orderBy: { entryTime: "asc" },
      },
    },
  });

  let totalStartingBalance = 0;
  let totalDrawdown = 0;
  for (const a of accounts) {
    const startingBalance = a.startingBalance ?? 0;
    totalStartingBalance += startingBalance;
    const dd = computeDrawdown(
      startingBalance,
      a.trades.map((t) => t.netPnl ?? 0),
    );
    totalDrawdown += dd.currentDrawdown;
  }

  return totalStartingBalance > 0
    ? (totalDrawdown / totalStartingBalance) * 100
    : null;
}

export async function getCoachScorecardInput(): Promise<ScorecardInput> {
  const [analytics, coach, drawdownPct] = await Promise.all([
    getAnalyticsData(),
    getCoachData(),
    getAggregateDrawdownPct(),
  ]);

  return {
    profitability: {
      winRate: analytics.totals.winRate,
      profitFactor: analytics.totals.profitFactor,
    },
    systemEdge: {
      cleanWinRate: analytics.systemEdge.clean.winRate,
      blendedWinRate: analytics.systemEdge.blended.winRate,
      winRateGapPct: analytics.systemEdge.winRateGapPct,
    },
    tradeManagement: {
      hurtCount: analytics.management.hurtByManagementCount,
      improvedCount: analytics.management.improvedByManagementCount,
      managementImpactPct: analytics.management.managementImpactPct,
    },
    riskManagement: {
      drawdownPct,
      maxConsecutiveLosses: analytics.stats.maxConsecutiveLosses,
      largestLoss: analytics.stats.largestLoss,
    },
    tradingProcess: { avgDisciplineScore: coach.avgDisciplineScore },
  };
}

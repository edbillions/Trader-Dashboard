import { prisma } from "@/lib/prisma";
import { getMistakesData } from "@/lib/data/mistakes";
import {
  computeCohortTrend,
  computeExpectancyDelta,
  computeFrequencyImpact,
  type CohortTrend,
  type ExpectancyDelta,
  type FrequencyTier,
} from "@/lib/domain/decision-intelligence";

export interface DecisionIntelligenceInput {
  cohortTrend: CohortTrend | null;
  worstMistake: {
    label: string;
    count: number;
    netPnl: number;
    winRate: number | null;
  } | null;
  expectancyDelta: ExpectancyDelta | null;
  frequencyImpact: { tiers: FrequencyTier[] };
  totals: { tradeCount: number; winRate: number | null };
}

export async function getDecisionIntelligenceInput(): Promise<DecisionIntelligenceInput> {
  const [trades, mistakesData, tradingDays] = await Promise.all([
    prisma.trade.findMany({
      select: {
        entryTime: true,
        netPnl: true,
        rMultiple: true,
        mistakes: { select: { label: true } },
      },
      orderBy: { entryTime: "asc" },
    }),
    getMistakesData(),
    prisma.tradingDay.findMany({
      select: {
        trades: { select: { netPnl: true, rMultiple: true } },
      },
    }),
  ]);

  // getMistakesData().byMistake is sorted by count, not netPnl — re-sort a
  // local copy so "worst" actually means costliest, not most-frequent.
  const worstMistakeEntry = [...mistakesData.byMistake].sort(
    (a, b) => a.netPnl - b.netPnl,
  )[0];
  // A trader can be net-positive even on mistake-tagged trades — in that
  // case there's honestly no "costliest habit" to report.
  const worstMistake =
    worstMistakeEntry && worstMistakeEntry.netPnl < 0
      ? {
          label: worstMistakeEntry.label,
          count: worstMistakeEntry.count,
          netPnl: worstMistakeEntry.netPnl,
          winRate: worstMistakeEntry.winRate,
        }
      : null;

  const wins = trades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losses = trades.filter((t) => (t.netPnl ?? 0) < 0).length;

  return {
    cohortTrend: computeCohortTrend(trades),
    worstMistake,
    expectancyDelta: worstMistake
      ? computeExpectancyDelta(trades, worstMistake.label)
      : null,
    frequencyImpact: computeFrequencyImpact(tradingDays),
    totals: {
      tradeCount: trades.length,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : null,
    },
  };
}

import { prisma } from "@/lib/prisma";
import { groupStats } from "@/lib/data/analytics";
import {
  computeStreak,
  computeMissedWeekdays,
  computeTradeStreaks,
} from "@/lib/domain/streaks";
import {
  detectTiltSignals,
  computeRevengeTradeCost,
  type TiltDayInput,
} from "@/lib/domain/tilt";
import {
  computeRiskAgent,
  computeHabitAgent,
  computePatternAgent,
  computeSentimentAgent,
  computeAvgLossSize,
} from "@/lib/domain/agents";

const MISSED_WEEKDAYS_WINDOW = 10;
const TILT_LOOKBACK_DAYS = 30;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getAgentInsights() {
  const today = todayKey();

  const days = await prisma.tradingDay.findMany({
    orderBy: { date: "desc" },
    include: {
      trades: {
        select: {
          id: true,
          entryTime: true,
          exitTime: true,
          positionSize: true,
          netPnl: true,
          rMultiple: true,
          session: true,
          entryModel: true,
          accountId: true,
          account: { select: { dailyLossLimit: true } },
        },
        orderBy: { entryTime: "asc" },
      },
    },
  });

  const entriesByDate = new Map(
    days.map((d) => [d.date.toISOString().slice(0, 10), d]),
  );
  const todayEntry = entriesByDate.get(today) ?? null;

  const allTrades = days.flatMap((d) => d.trades);
  const allTradesChrono = [...allTrades].sort(
    (a, b) => a.entryTime.getTime() - b.entryTime.getTime(),
  );

  const journalingStreak = computeStreak(entriesByDate, () => true);
  const missedWeekdays = computeMissedWeekdays(
    entriesByDate,
    MISSED_WEEKDAYS_WINDOW,
  );

  const byHour = groupStats(allTrades, (t) => {
    const h = t.entryTime.getHours();
    return `${h.toString().padStart(2, "0")}:00`;
  });
  const bySession = groupStats(allTrades, (t) => t.session);
  const byEntryModel = groupStats(allTrades, (t) => t.entryModel);

  const accountDailyLossLimits = new Map<string, number>();
  for (const t of allTrades) {
    if (t.accountId && t.account?.dailyLossLimit != null) {
      accountDailyLossLimits.set(t.accountId, t.account.dailyLossLimit);
    }
  }

  const recentSignals = days.slice(0, TILT_LOOKBACK_DAYS).flatMap((d) =>
    detectTiltSignals({
      date: d.date.toISOString().slice(0, 10),
      maxTradeCountPlan: d.maxTradeCountPlan,
      sessionTiming: d.sessionTiming,
      trades: d.trades,
    } satisfies TiltDayInput),
  );

  const todaySignals = todayEntry
    ? detectTiltSignals({
        date: today,
        maxTradeCountPlan: todayEntry.maxTradeCountPlan,
        sessionTiming: todayEntry.sessionTiming,
        trades: todayEntry.trades,
      } satisfies TiltDayInput)
    : [];

  const risk = computeRiskAgent({
    maxLossPlan: todayEntry?.maxLossPlan ?? null,
    maxTradeCountPlan: todayEntry?.maxTradeCountPlan ?? null,
    todayTrades: todayEntry?.trades ?? [],
    avgLossSize: computeAvgLossSize(allTrades),
    accountDailyLossLimits,
  });

  const habit = computeHabitAgent({
    journalingStreak,
    missedWeekdays,
    missedWeekdaysWindow: MISSED_WEEKDAYS_WINDOW,
  });

  const pattern = computePatternAgent({
    byHour,
    edgeCandidates: [...bySession, ...byEntryModel],
    revengeTradeCost: computeRevengeTradeCost(recentSignals),
    bestWinStreak: computeTradeStreaks(allTradesChrono).bestWinStreak,
  });

  const sentiment = computeSentimentAgent({ todaySignals });

  return { risk, habit, pattern, sentiment };
}

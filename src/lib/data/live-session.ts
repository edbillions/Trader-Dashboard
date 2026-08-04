import { prisma } from "@/lib/prisma";
import { detectTiltSignals } from "@/lib/domain/tilt";
import { computeCooldownState } from "@/lib/domain/cooldown";
import { computeCrashoutMeter, canTakeAnotherTrade } from "@/lib/domain/crashout-meter";
import { computeTradeStreaks } from "@/lib/domain/streaks";

// Live Session cockpit: composes today's TradingDay + trades + settings
// into everything the /live-session page needs pre-computed.

export async function getLiveSessionData(dateKey: string) {
  const dateOnly = new Date(`${dateKey}T00:00:00`);

  const [day, settings] = await Promise.all([
    prisma.tradingDay.findUnique({
      where: { date: dateOnly },
      include: {
        trades: { orderBy: { entryTime: "asc" } },
      },
    }),
    prisma.appSettings.findUnique({ where: { id: 1 } }),
  ]);

  const cooldownMinutes = settings?.cooldownMinutes ?? 5;
  const trades = day?.trades ?? [];
  const now = new Date();

  const tiltSignals = detectTiltSignals({
    date: dateKey,
    maxTradeCountPlan: day?.maxTradeCountPlan ?? null,
    sessionTiming: day?.sessionTiming ?? null,
    trades: trades.map((t) => ({
      id: t.id,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      positionSize: t.positionSize,
      netPnl: t.netPnl,
      session: t.session,
    })),
  });

  const lastTrade = trades[trades.length - 1] ?? null;
  const lastTradeTime = lastTrade ? lastTrade.exitTime ?? lastTrade.entryTime : null;
  const cooldown = computeCooldownState({ lastTradeTime, cooldownMinutes, now });

  const lossUsedToday = Math.abs(
    trades
      .map((t) => t.netPnl ?? 0)
      .filter((pnl) => pnl < 0)
      .reduce((a, b) => a + b, 0),
  );
  const maxLossPlan = day?.maxLossPlan ?? null;
  const maxTradeCountPlan = day?.maxTradeCountPlan ?? null;
  const lossPct =
    maxLossPlan != null && maxLossPlan > 0 ? (lossUsedToday / Math.abs(maxLossPlan)) * 100 : null;
  const tradeCountPct =
    maxTradeCountPlan != null && maxTradeCountPlan > 0
      ? (trades.length / maxTradeCountPlan) * 100
      : null;

  const streaks = computeTradeStreaks(trades);
  const consecutiveLossesToday = streaks.currentType === "loss" ? streaks.currentCount : 0;

  const emergencyPauseActive = Boolean(
    day?.emergencyPauseUntil && day.emergencyPauseUntil.getTime() > now.getTime(),
  );
  const emergencyPauseUsedToday = Boolean(day?.emergencyPauseUntil);
  const sessionEnded = Boolean(day?.sessionEndedAt);

  const crashout = computeCrashoutMeter({
    tiltSignals,
    consecutiveLossesToday,
    lossPct,
    tradeCountPct,
    cooldownActive: cooldown.active,
    emergencyPauseActive,
    emergencyPauseUsedToday,
  });

  const permission = canTakeAnotherTrade({
    cooldownActive: cooldown.active,
    emergencyPauseActive,
    sessionEnded,
    maxTradeCountPlan,
    tradesTakenToday: trades.length,
    maxLossPlan,
    lossUsedToday,
    crashoutState: crashout.state,
  });

  const netPnlToday = trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);

  return {
    dateKey,
    day,
    trades,
    cooldownMinutes,
    cooldown,
    tiltSignals,
    lossUsedToday,
    lossPct,
    tradeCountPct,
    maxLossPlan,
    maxTradeCountPlan,
    profitLockPlan: day?.profitLockPlan ?? null,
    missionLabel: day?.missionLabel ?? null,
    crashout,
    permission,
    emergencyPauseActive,
    emergencyPauseUntil: day?.emergencyPauseUntil ?? null,
    sessionEnded,
    sessionEndedAt: day?.sessionEndedAt ?? null,
    netPnlToday,
  };
}

export type LiveSessionData = Awaited<ReturnType<typeof getLiveSessionData>>;

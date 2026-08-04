import { getTradingDayDetail } from "@/lib/data/trading-day";
import { detectTiltSignals } from "@/lib/domain/tilt";
import { parseScorecard, scorecardTotal, scorecardBand } from "@/lib/types/scorecard";
import { scoreToLetterGrade } from "@/lib/domain/session-grade";
import { computeIdentityPings } from "@/lib/domain/identity-pings";
import { computeGreenFlags } from "@/lib/domain/green-flags";
import { computeBehaviorReview } from "@/lib/domain/behavior-review";
import { computeTomorrowsFocus } from "@/lib/domain/tomorrows-focus";
import { pickTomorrowMessage } from "@/lib/domain/tomorrow-message";
import { computeCrashoutMeter } from "@/lib/domain/crashout-meter";
import { computeTradeStreaks } from "@/lib/domain/streaks";

// Live Session Daily Recap: reuses the existing getTradingDayDetail() query,
// layers on all the pure Live Session domain functions. Returns null when
// there's no day yet, or the session hasn't been ended (recap is only valid
// post-End Session).
export async function getDailyRecapData(dateKey: string) {
  const day = await getTradingDayDetail(dateKey);
  if (!day || !day.sessionEndedAt) return null;

  const tiltSignals = detectTiltSignals({
    date: dateKey,
    maxTradeCountPlan: day.maxTradeCountPlan,
    sessionTiming: day.sessionTiming,
    trades: day.trades.map((t) => ({
      id: t.id,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      positionSize: t.positionSize,
      netPnl: t.netPnl,
      session: t.session,
    })),
  });

  const scorecard = parseScorecard(day.scorecard);
  const total = scorecardTotal(scorecard);
  const band = scorecardBand(total);
  const grade = scoreToLetterGrade(total);

  const emergencyPauseUsed = Boolean(day.emergencyPauseUntil);

  const identityPings = computeIdentityPings({
    scorecard,
    scorecardTotal: total,
    tiltSignals,
    emergencyPauseUsed,
  });

  const netPnlToday = day.trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
  const lossUsedToday = Math.abs(
    day.trades
      .map((t) => t.netPnl ?? 0)
      .filter((pnl) => pnl < 0)
      .reduce((a, b) => a + b, 0),
  );
  const wins = day.trades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losses = day.trades.filter((t) => (t.netPnl ?? 0) < 0).length;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;

  const greenFlags = computeGreenFlags({
    tiltSignals,
    tradesTaken: day.trades.length,
    maxTradeCountPlan: day.maxTradeCountPlan,
    lossUsedToday,
    maxLossPlan: day.maxLossPlan,
    emergencyPauseUsed,
  });

  const lossPct =
    day.maxLossPlan != null && day.maxLossPlan !== 0
      ? (lossUsedToday / Math.abs(day.maxLossPlan)) * 100
      : null;
  const tradeCountPct =
    day.maxTradeCountPlan != null && day.maxTradeCountPlan > 0
      ? (day.trades.length / day.maxTradeCountPlan) * 100
      : null;
  const streaks = computeTradeStreaks(day.trades);
  const consecutiveLossesToday = streaks.currentType === "loss" ? streaks.currentCount : 0;

  // End-of-day Discipline Arc reading — reuses the exact same Crashout Meter
  // domain function as the live cockpit (no duplicate risk-scoring logic),
  // evaluated with cooldown/pause both inactive since the session is over.
  const crashout = computeCrashoutMeter({
    tiltSignals,
    consecutiveLossesToday,
    lossPct,
    tradeCountPct,
    cooldownActive: false,
    emergencyPauseActive: false,
    emergencyPauseUsedToday: emergencyPauseUsed,
  });

  const behaviorReview = computeBehaviorReview({ tiltSignals, scorecard });
  const tomorrowsFocus = computeTomorrowsFocus(scorecard);
  const hadSevereTiltSignal = tiltSignals.some(
    (s) => s.type === "overtrading" || s.type === "revenge_trading",
  );
  const tomorrowMessage = pickTomorrowMessage({
    netPnlToday,
    hadSevereTiltSignal,
    date: day.date,
  });

  // Mission score /10: within max trades, within max loss, hit profit lock
  // (if set), no severe tilt signal, ended voluntarily — each worth up to 2.
  let missionPoints = 0;
  let missionPossible = 0;
  missionPossible += 2;
  if (day.maxTradeCountPlan == null || day.trades.length <= day.maxTradeCountPlan) {
    missionPoints += 2;
  }
  missionPossible += 2;
  if (day.maxLossPlan == null || lossUsedToday <= Math.abs(day.maxLossPlan)) {
    missionPoints += 2;
  }
  if (day.profitLockPlan != null) {
    missionPossible += 2;
    if (netPnlToday >= day.profitLockPlan) missionPoints += 2;
  }
  missionPossible += 2;
  if (!hadSevereTiltSignal) missionPoints += 2;
  missionPossible += 2;
  missionPoints += 2; // sessionEndedAt is guaranteed set (recap requires it) — voluntary end
  const missionScore = missionPossible > 0 ? (missionPoints / missionPossible) * 10 : 10;

  return {
    dateKey,
    day,
    tiltSignals,
    scorecard,
    scorecardTotal: total,
    scorecardBand: band,
    disciplineScore100: total * 2,
    grade,
    crashout,
    identityPings,
    greenFlags,
    behaviorReview,
    tomorrowsFocus,
    tomorrowMessage,
    netPnlToday,
    lossUsedToday,
    winRate,
    missionScore: Math.round(missionScore * 10) / 10,
    trades: day.trades,
  };
}

export type DailyRecapData = Awaited<ReturnType<typeof getDailyRecapData>>;

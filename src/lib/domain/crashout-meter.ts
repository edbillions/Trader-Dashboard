import type { TiltSignal } from "@/lib/domain/tilt";
import type { AgentTone } from "@/lib/domain/agents";

// Live Session: the 0-10 "Crashout Meter" emotional-risk gauge, plus the
// "can I take another trade?" permission check. Pure functions — every
// input is already-computed data (tilt signals, plan %s, cooldown/pause
// state), no I/O here.

export interface CrashoutMeterInput {
  tiltSignals: TiltSignal[];
  consecutiveLossesToday: number;
  lossPct: number | null; // % of maxLossPlan used
  tradeCountPct: number | null; // % of maxTradeCountPlan used
  cooldownActive: boolean;
  emergencyPauseActive: boolean;
  emergencyPauseUsedToday: boolean;
}

export interface CrashoutFactor {
  label: string;
  delta: number; // positive = added risk, negative = reduced risk
  positive: boolean; // true = a good/calming factor, false = a risk-adding factor
}

export type CrashoutState = "calm" | "elevated" | "peak";

export interface CrashoutMeterResult {
  score: number; // 0-10, clamped
  state: CrashoutState;
  stateLabel: string;
  factors: CrashoutFactor[]; // "why your score changed"
  nextBestAction: string;
  safetyBanner: { tone: AgentTone; message: string } | null;
}

const STATE_LABEL: Record<CrashoutState, string> = {
  calm: "CALM",
  elevated: "Elevated",
  peak: "Peak Risk Reached",
};

export function computeCrashoutMeter(
  input: CrashoutMeterInput,
): CrashoutMeterResult {
  const factors: CrashoutFactor[] = [];
  let score = 0;

  const overtrading = input.tiltSignals.filter((s) => s.type === "overtrading");
  const revenge = input.tiltSignals.filter((s) => s.type === "revenge_trading");
  const sizeUp = input.tiltSignals.filter((s) => s.type === "size_up_after_loss");
  const offPlan = input.tiltSignals.filter((s) => s.type === "off_plan");

  if (overtrading.length > 0) {
    score += 2;
    factors.push({ label: "Overtrading detected today", delta: 2, positive: false });
  }
  if (revenge.length > 0) {
    score += 2;
    factors.push({ label: "Revenge trading detected today", delta: 2, positive: false });
  }
  if (sizeUp.length > 0) {
    score += 1;
    factors.push({ label: "Sized up after a loss", delta: 1, positive: false });
  }
  if (offPlan.length > 0) {
    score += 1;
    factors.push({ label: "Traded outside the planned session", delta: 1, positive: false });
  }
  if (input.tiltSignals.length === 0) {
    factors.push({ label: "No tilt signals today", delta: 0, positive: true });
  }

  if (input.consecutiveLossesToday > 1) {
    const delta = input.consecutiveLossesToday - 1;
    score += delta;
    factors.push({
      label: `${input.consecutiveLossesToday} losses in a row`,
      delta,
      positive: false,
    });
  }

  if (input.lossPct != null && input.lossPct >= 100) {
    score += 3;
    factors.push({ label: "Daily loss plan breached", delta: 3, positive: false });
  } else if (input.lossPct != null && input.lossPct >= 75) {
    score += 1.5;
    factors.push({ label: "Near your daily loss limit", delta: 1.5, positive: false });
  } else if (input.lossPct != null) {
    factors.push({ label: "Within your daily loss limit", delta: 0, positive: true });
  }

  if (input.tradeCountPct != null && input.tradeCountPct >= 100) {
    score += 2;
    factors.push({ label: "Max trade count breached", delta: 2, positive: false });
  } else if (input.tradeCountPct != null && input.tradeCountPct >= 75) {
    score += 1;
    factors.push({ label: "Near your max trade count", delta: 1, positive: false });
  } else if (input.tradeCountPct != null) {
    factors.push({ label: "Paced within your trade-count plan", delta: 0, positive: true });
  }

  if (input.emergencyPauseUsedToday) {
    score += 2;
    factors.push({ label: "Used the emergency pause today", delta: 2, positive: false });
  }

  if (input.cooldownActive) {
    score += 1;
    factors.push({ label: "Cooldown timer currently active", delta: 1, positive: false });
  }

  score = Math.max(0, Math.min(10, score));

  const state: CrashoutState = score < 4 ? "calm" : score < 7.5 ? "elevated" : "peak";

  const nextBestAction =
    state === "peak"
      ? "Stop trading. Step away from the charts for the rest of the session."
      : state === "elevated"
        ? "Protect your progress. Avoid forcing the next trade."
        : "Stay the course. Keep trading your plan.";

  // Hard limit breaches (daily loss / trade count) surface the alert banner
  // directly, independent of the tilt-based score — a single clean trade
  // that blows the daily loss plan should never read as "calm" just because
  // no chasing/overtrading behavior has shown up yet.
  const hardBreach =
    (input.lossPct != null && input.lossPct >= 100) ||
    (input.tradeCountPct != null && input.tradeCountPct >= 100);

  let safetyBanner: { tone: AgentTone; message: string } | null = null;
  if (input.emergencyPauseActive) {
    safetyBanner = { tone: "alert", message: "PAUSED — emergency cooldown in effect." };
  } else if (hardBreach || state === "peak") {
    safetyBanner = { tone: "alert", message: "TRADE WITH CAUTION — negative risk detected." };
  } else if (state === "elevated") {
    safetyBanner = { tone: "watch", message: "Trade carefully — risk is building." };
  }

  return {
    score,
    state,
    stateLabel: STATE_LABEL[state],
    factors,
    nextBestAction,
    safetyBanner,
  };
}

export interface CanTakeAnotherTradeInput {
  cooldownActive: boolean;
  emergencyPauseActive: boolean;
  sessionEnded: boolean;
  maxTradeCountPlan: number | null;
  tradesTakenToday: number;
  maxLossPlan: number | null;
  lossUsedToday: number;
  crashoutState: CrashoutState;
}

export interface PermissionCheck {
  allowed: boolean;
  reasons: string[];
}

export function canTakeAnotherTrade(
  input: CanTakeAnotherTradeInput,
): PermissionCheck {
  const reasons: string[] = [];

  if (input.sessionEnded) {
    reasons.push("Session has ended for today.");
  }
  if (input.emergencyPauseActive) {
    reasons.push("Emergency pause is active — wait it out.");
  }
  if (input.cooldownActive) {
    reasons.push("Wait for the cooldown timer to clear before entering another trade.");
  }
  if (
    input.maxTradeCountPlan != null &&
    input.tradesTakenToday >= input.maxTradeCountPlan
  ) {
    reasons.push(`Already at your planned max of ${input.maxTradeCountPlan} trades today.`);
  }
  if (
    input.maxLossPlan != null &&
    input.lossUsedToday >= Math.abs(input.maxLossPlan)
  ) {
    reasons.push("Daily loss plan has been reached.");
  }
  if (input.crashoutState === "peak") {
    reasons.push("Crashout Meter is at peak risk — not cleared to trade.");
  }

  return { allowed: reasons.length === 0, reasons };
}

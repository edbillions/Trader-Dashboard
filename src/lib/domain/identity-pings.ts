import type { ScorecardScores } from "@/lib/types/scorecard";
import type { TiltSignal } from "@/lib/domain/tilt";

// Live Session Daily Recap: gamified "Identity Pings" / "Today You Became"
// badges. Fully computed at render time from the day's already-derived
// scorecard + tilt signals — no persistence, no existing badge system to
// extend (this is genuinely new territory in this codebase).

export interface IdentityPing {
  label: string;
  points: number;
  positive: boolean;
}

export interface IdentityPingsInput {
  scorecard: ScorecardScores;
  scorecardTotal: number;
  tiltSignals: TiltSignal[];
  emergencyPauseUsed: boolean;
}

export function computeIdentityPings(input: IdentityPingsInput): IdentityPing[] {
  const pings: IdentityPing[] = [];

  const screenTime = input.scorecard["screen-time-management"] ?? 0;
  const overtrading = input.tiltSignals.some((s) => s.type === "overtrading");
  if (screenTime >= 4 && !overtrading) {
    pings.push({ label: "Patient Trader", points: 50, positive: true });
  }

  const risk = input.scorecard["risk-management"] ?? 0;
  const sessionEnd = input.scorecard["session-end-discipline"] ?? 0;
  if (risk >= 4 && sessionEnd >= 4) {
    pings.push({ label: "Disciplined Trader", points: 50, positive: true });
  }

  if (input.scorecardTotal >= 45) {
    pings.push({ label: "Professional Trader", points: 50, positive: true });
  }

  const hasSevereSignal = input.tiltSignals.some(
    (s) => s.type === "revenge_trading" || s.type === "overtrading",
  );
  if (hasSevereSignal || input.emergencyPauseUsed) {
    pings.push({ label: "Emotional Trader", points: -20, positive: false });
  }

  return pings;
}

import { SCORECARD_CATEGORIES, type ScorecardScores } from "@/lib/types/scorecard";
import type { TiltSignal } from "@/lib/domain/tilt";

// Live Session: derives a 0-5 score for each of the EXISTING 10 Scorecard
// categories (src/lib/types/scorecard.ts) from objectively observable
// session behavior, so End Session can auto-populate the same
// TradingDay.scorecard column the Journal wizard's Post-Session Review step
// already writes to manually — one system, not two. Only ever used when no
// manual scorecard exists yet for the day (enforced by the caller, not here).

export interface AutoScorecardInput {
  tiltSignals: TiltSignal[];
  maxLossPlan: number | null;
  maxTradeCountPlan: number | null;
  lossUsedToday: number;
  tradesTakenToday: number;
  emergencyPauseUsed: boolean;
  sessionEndedVoluntarily: boolean; // TradingDay.sessionEndedAt was set via End Session
  hasPreMarketPlan: boolean; // htfBias/keyLevels/preMarketChecklist non-empty
  debriefFilled: boolean; // debriefImprovement/debriefFeeling non-empty
}

function hasSignal(signals: TiltSignal[], type: TiltSignal["type"]): boolean {
  return signals.some((s) => s.type === type);
}

export function computeAutoScorecard(input: AutoScorecardInput): ScorecardScores {
  const scores: ScorecardScores = {};

  scores["pre-market-routine"] = input.hasPreMarketPlan ? 5 : 2;

  // No reliable behavioral signal exists for exact session-start punctuality
  // in this app today — documented neutral default rather than a fabricated
  // read.
  scores["session-start-time"] = 4;

  scores["setup-discipline"] = hasSignal(input.tiltSignals, "off_plan") ? 2 : 5;

  {
    const lossBreach =
      input.maxLossPlan != null && input.lossUsedToday >= Math.abs(input.maxLossPlan);
    const severeLossBreach =
      input.maxLossPlan != null &&
      input.lossUsedToday >= Math.abs(input.maxLossPlan) * 1.5;
    const sizeUp = hasSignal(input.tiltSignals, "size_up_after_loss");
    const tradeCountBreach =
      input.maxTradeCountPlan != null &&
      input.tradesTakenToday > input.maxTradeCountPlan;

    if (severeLossBreach) scores["risk-management"] = 1;
    else if (lossBreach || sizeUp || tradeCountBreach) scores["risk-management"] = 3;
    else scores["risk-management"] = 5;
  }

  scores["trade-execution"] = hasSignal(input.tiltSignals, "revenge_trading") ? 1 : 5;

  {
    const cleanTilt = input.tiltSignals.length === 0;
    if (input.emergencyPauseUsed) scores["emotional-control"] = 0;
    else if (cleanTilt) scores["emotional-control"] = 5;
    else scores["emotional-control"] = 3;
  }

  scores["session-end-discipline"] = input.sessionEndedVoluntarily ? 5 : 2;

  scores["post-session-review"] = input.debriefFilled ? 5 : 2;

  scores["screen-time-management"] = hasSignal(input.tiltSignals, "overtrading") ? 2 : 5;

  {
    const others = SCORECARD_CATEGORIES.filter((c) => c.key !== "identity-alignment").map(
      (c) => scores[c.key] ?? 0,
    );
    const avg = others.reduce((a, b) => a + b, 0) / others.length;
    scores["identity-alignment"] = Math.round(avg);
  }

  return scores;
}

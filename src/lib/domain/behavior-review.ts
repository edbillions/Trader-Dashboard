import { SCORECARD_CATEGORIES, type ScorecardScores } from "@/lib/types/scorecard";
import type { TiltSignal } from "@/lib/domain/tilt";

// Live Session Daily Recap: "Behavior Review" — What Helped vs. Watch
// Tomorrow. Templated/conditional, not AI — mirrors the fully rule-based
// nature of the rest of this feature.

export interface BehaviorReviewInput {
  tiltSignals: TiltSignal[];
  scorecard: ScorecardScores;
}

export interface BehaviorReview {
  whatHelped: string[];
  watchTomorrow: string[];
}

export function computeBehaviorReview(input: BehaviorReviewInput): BehaviorReview {
  const whatHelped: string[] = [];
  const watchTomorrow: string[] = [];

  if (!input.tiltSignals.some((s) => s.type === "overtrading")) {
    whatHelped.push("Stayed within your planned trade count.");
  } else {
    watchTomorrow.push("Overtrading crept in — hold the line on your trade-count plan.");
  }

  if (!input.tiltSignals.some((s) => s.type === "revenge_trading")) {
    whatHelped.push("No revenge trades — losses were let go, not chased.");
  } else {
    watchTomorrow.push("A loss triggered a fast re-entry — build in a cooldown before the next trade.");
  }

  if (!input.tiltSignals.some((s) => s.type === "size_up_after_loss")) {
    whatHelped.push("Position size stayed consistent after losses.");
  } else {
    watchTomorrow.push("Size crept up after a loss — keep risk-per-trade flat regardless of the last outcome.");
  }

  for (const category of SCORECARD_CATEGORIES) {
    const score = input.scorecard[category.key];
    if (score != null && score < 3) {
      watchTomorrow.push(`${category.label} slipped today — revisit: ${category.description}`);
    }
  }

  if (whatHelped.length === 0) {
    whatHelped.push("Logged today's session — that alone builds the review habit.");
  }
  if (watchTomorrow.length === 0) {
    watchTomorrow.push("Nothing stands out — repeat today's process.");
  }

  return { whatHelped, watchTomorrow };
}

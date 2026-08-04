import { SCORECARD_CATEGORIES, type ScorecardScores } from "@/lib/types/scorecard";

// Live Session Daily Recap: "Tomorrow's Focus" — picks the single
// lowest-scoring scorecard category as the next-session focus area.

export interface TomorrowsFocus {
  label: string;
  description: string;
}

export function computeTomorrowsFocus(scorecard: ScorecardScores): TomorrowsFocus {
  let worst = SCORECARD_CATEGORIES[0];
  let worstScore = scorecard[worst.key] ?? 0;

  for (const category of SCORECARD_CATEGORIES) {
    const score = scorecard[category.key] ?? 0;
    if (score < worstScore) {
      worst = category;
      worstScore = score;
    }
  }

  if (worstScore >= 4) {
    return {
      label: "Repeat today's process",
      description: "Every category held up well — run it back tomorrow.",
    };
  }

  return {
    label: worst.label,
    description: worst.description,
  };
}

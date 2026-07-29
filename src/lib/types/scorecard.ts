export interface ScorecardCategory {
  key: string;
  label: string;
  description: string;
}

export const SCORECARD_CATEGORIES: ScorecardCategory[] = [
  {
    key: "pre-market-routine",
    label: "Pre-Market Routine",
    description:
      "Completed chart markup, bias planning, breathing/mindset prep before trading began.",
  },
  {
    key: "session-start-time",
    label: "Session Start Time",
    description: "Was I seated and focused before 8:30 AM?",
  },
  {
    key: "setup-discipline",
    label: "Setup Discipline",
    description:
      "Only took trades that matched full Unicorn Model criteria alignment, PD array, liquidity sweep, FVG, etc.)",
  },
  {
    key: "risk-management",
    label: "Risk Management",
    description:
      "Followed pre-defined risk per trade. No increases due to emotion or FOMO.",
  },
  {
    key: "trade-execution",
    label: "Trade Execution",
    description:
      "Entered and exited trades cleanly according to plan (not hesitation or gut feel).",
  },
  {
    key: "emotional-control",
    label: "Emotional Control",
    description:
      "Stayed calm and composed—no revenge trades, FOMO, tilt, or second-guessing.",
  },
  {
    key: "session-end-discipline",
    label: "Session End Discipline",
    description:
      "Stopped trading by 12:15 PM. No chart watching or re-entering trades afterward.",
  },
  {
    key: "post-session-review",
    label: "Post-Session Review",
    description:
      "Took screenshots, journaled trades, rated setups, and reflected on behavior.",
  },
  {
    key: "screen-time-management",
    label: "Screen Time Management",
    description: "Walked away during dead zones. No forcing trades",
  },
  {
    key: "identity-alignment",
    label: "Identity Alignment",
    description:
      "Did I act like a high-level funded trader building a 7-figure track record?",
  },
];

export const SCORECARD_MAX_POINTS = SCORECARD_CATEGORIES.length * 5;

export type ScorecardScores = Record<string, number | null>;

export function emptyScorecard(): ScorecardScores {
  return Object.fromEntries(SCORECARD_CATEGORIES.map((c) => [c.key, null]));
}

export function parseScorecard(raw: string | null): ScorecardScores {
  if (!raw) return emptyScorecard();
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyScorecard(), ...parsed };
  } catch {
    return emptyScorecard();
  }
}

export function scorecardTotal(scores: ScorecardScores): number {
  return SCORECARD_CATEGORIES.reduce(
    (sum, c) => sum + (scores[c.key] ?? 0),
    0,
  );
}

export function scorecardBand(total: number): {
  label: string;
  colorClass: string;
} {
  if (total >= 45) {
    return { label: "Elite Discipline Day", colorClass: "text-profit" };
  }
  if (total >= 35) {
    return {
      label: "Solid but Review What Slipped",
      colorClass: "text-yellow-500",
    };
  }
  return { label: "Audit Yourself + Rewrite Intentions", colorClass: "text-loss" };
}

import { CRITERIA_WEIGHTS, gradeFor, type GradeInfo } from "@/app/setup-grader/grading";
import type { SetupFactorsChecklist } from "@/lib/types/setup-factors-checklist";

const CONFIRMED_FLAGS: (keyof SetupFactorsChecklist)[] = [
  "biasConfirmed",
  "dolIdentified",
  "liquiditySweepConfirmed",
  "htfDeliveryConfirmed",
  "premiumDiscountConfirmed",
  "breakerBlockConfirmed",
  "notAt2RConfirmed",
  "macroWindowConfirmed",
];
const WEIGHT_KEYS: (keyof typeof CRITERIA_WEIGHTS)[] = [
  "bias",
  "dol",
  "liq",
  "htfpd",
  "pd",
  "bb",
  "2r",
  "macro",
];

const BASE_TOTAL_WEIGHT = (Object.values(CRITERIA_WEIGHTS) as number[]).reduce(
  (a, b) => a + b,
  0,
);

// Multiple confirmed sweeps/FVG levels on the same criterion signal stronger
// confluence (a higher-probability setup), so each additional one beyond the
// first earns bonus points — capped so a setup can't inflate its score just
// by checking every box in the sub-panel. The caps themselves also define
// each dimension's contribution to the shared points denominator
// (MAX_POSSIBLE_SCORE below), so raising a cap to reward high-confluence
// setups more only works if the rate-per-extra grows too — a cap-only raise
// would inflate the denominator right along with the numerator and net
// nothing. Liquidity sweeps are worth +2 per extra sweep beyond the first
// (reaches the +3 cap at 3 total sweeps); HTF FVG levels are +1 per extra
// level beyond the first (reaches the +2 cap when all 3 levels are flagged).
export const MAX_LIQUIDITY_BONUS = 3;
export const MAX_HTF_FVG_BONUS = 2;
export const LIQUIDITY_POINTS_PER_EXTRA = 2;
export const HTF_FVG_POINTS_PER_EXTRA = 1;

export const MAX_POSSIBLE_SCORE =
  BASE_TOTAL_WEIGHT + MAX_LIQUIDITY_BONUS + MAX_HTF_FVG_BONUS;

// Shared by both the Journal's Setup Factors checklist and the standalone
// Setup Grader page, so "extra sweep/level bonus" means exactly one thing
// everywhere it's used.
export function extraSelectionBonus(
  selectedCount: number,
  max: number,
  pointsPerExtra = 1,
): number {
  return Math.min(Math.max(selectedCount - 1, 0) * pointsPerExtra, max);
}

export interface SetupFactorsScore {
  confirmedCount: number;
  baseEarned: number;
  liquidityBonus: number;
  htfFvgBonus: number;
  totalEarned: number;
  maxPossible: number;
}

export function computeSetupFactorsScore(
  value: SetupFactorsChecklist,
): SetupFactorsScore {
  let baseEarned = 0;
  let confirmedCount = 0;
  for (let i = 0; i < CONFIRMED_FLAGS.length; i++) {
    if (value[CONFIRMED_FLAGS[i]]) {
      confirmedCount++;
      baseEarned += CRITERIA_WEIGHTS[WEIGHT_KEYS[i]];
    }
  }

  const liquidityBonus = value.liquiditySweepConfirmed
    ? extraSelectionBonus(
        value.liquiditySwept.length,
        MAX_LIQUIDITY_BONUS,
        LIQUIDITY_POINTS_PER_EXTRA,
      )
    : 0;
  const htfFvgBonus = value.htfDeliveryConfirmed
    ? extraSelectionBonus(
        value.htfFvgLevels.length,
        MAX_HTF_FVG_BONUS,
        HTF_FVG_POINTS_PER_EXTRA,
      )
    : 0;

  return {
    confirmedCount,
    baseEarned,
    liquidityBonus,
    htfFvgBonus,
    totalEarned: baseEarned + liquidityBonus + htfFvgBonus,
    maxPossible: MAX_POSSIBLE_SCORE,
  };
}

export interface SetupFactorsGrade extends GradeInfo {
  score: SetupFactorsScore;
}

// The standalone Setup Grader is a live, pre-trade go/no-go tool ("DO NOT
// TRADE — STAY FLAT", "EXECUTE — PRIME SETUP"), so its verdict/subtext is
// directive. This checklist is filled out in the Journal after the trade
// already happened — it's grading what the setup actually had, not deciding
// whether to take it — so the copy is reframed as retrospective analysis
// while reusing the same letter/percentage thresholds and color coding.
const POST_TRADE_COPY: Record<GradeInfo["letter"], { verdict: string; subtext: string }> = {
  "A+": {
    verdict: "Prime Unicorn setup",
    subtext: "Every criterion aligned — a high-conviction, textbook setup.",
  },
  A: {
    verdict: "Strong setup",
    subtext: "Well-structured with strong confluence.",
  },
  B: {
    verdict: "Acceptable setup",
    subtext: "Met the minimum bar, but light on confluence.",
  },
  C: {
    verdict: "Below standard",
    subtext: "Missing several key confluence factors.",
  },
  D: {
    verdict: "Weak setup",
    subtext: "Most criteria went unconfirmed.",
  },
  F: {
    verdict: "Did not qualify",
    subtext: "Didn't meet the Unicorn Model criteria.",
  },
};

// Same A+ through F scale as the standalone Setup Grader, driven by this
// checklist's own score (base weights + confluence bonus) instead of that
// page's separate interactive state.
export function gradeForSetupFactors(value: SetupFactorsChecklist): SetupFactorsGrade {
  const score = computeSetupFactorsScore(value);
  const pct = score.maxPossible > 0 ? score.totalEarned / score.maxPossible : 0;
  const base = gradeFor(pct);
  return { ...base, ...POST_TRADE_COPY[base.letter], score };
}

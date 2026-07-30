import { CRITERIA_WEIGHTS } from "@/app/setup-grader/grading";
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
// first earns a small bonus point — capped so a setup can't inflate its score
// just by checking every box in the sub-panel.
export const MAX_LIQUIDITY_BONUS = 3; // +1 per extra sweep beyond the first
export const MAX_HTF_FVG_BONUS = 2; // +1 per extra HTF FVG level beyond the first (3 levels exist)

export const MAX_POSSIBLE_SCORE =
  BASE_TOTAL_WEIGHT + MAX_LIQUIDITY_BONUS + MAX_HTF_FVG_BONUS;

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
    ? Math.min(Math.max(value.liquiditySwept.length - 1, 0), MAX_LIQUIDITY_BONUS)
    : 0;
  const htfFvgBonus = value.htfDeliveryConfirmed
    ? Math.min(Math.max(value.htfFvgLevels.length - 1, 0), MAX_HTF_FVG_BONUS)
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

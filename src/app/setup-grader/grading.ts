export const CRITERIA_WEIGHTS = {
  bias: 5,
  dol: 5,
  liq: 5,
  htfpd: 4,
  pd: 2,
  bb: 0, // knockout — 0 points but mandatory
  "2r": 5,
  macro: 3,
} as const;

export type CriterionKey = keyof typeof CRITERIA_WEIGHTS;
export const CRITERION_KEYS = Object.keys(CRITERIA_WEIGHTS) as CriterionKey[];

export const TOTAL_POINTS = 29; // sum of CRITERIA_WEIGHTS values

export const KNOCKOUT_KEYS: CriterionKey[] = ["bb"];

export interface GradeInfo {
  letter: "A+" | "A" | "B" | "C" | "D" | "F";
  colorClass: string;
  barColorVar: string;
  verdict: string;
  subtext: string;
}

export function gradeFor(pct: number): GradeInfo {
  if (pct >= 0.9)
    return {
      letter: "A+",
      colorClass: "cap",
      barColorVar: "var(--g-aplus)",
      verdict: "EXECUTE — PRIME SETUP",
      subtext:
        "All criteria align. High-conviction Unicorn. Size up within your risk rules.",
    };
  if (pct >= 0.8)
    return {
      letter: "A",
      colorClass: "ca",
      barColorVar: "var(--g-a)",
      verdict: "STRONG ENTRY SIGNAL",
      subtext:
        "Well-structured with strong confluence. Proceed with normal size.",
    };
  if (pct >= 0.65)
    return {
      letter: "B",
      colorClass: "cb",
      barColorVar: "var(--g-b)",
      verdict: "ACCEPTABLE — MIN THRESHOLD",
      subtext: "Minimum grade for entry. Reduce size, manage risk tightly.",
    };
  if (pct >= 0.5)
    return {
      letter: "C",
      colorClass: "cc",
      barColorVar: "var(--g-c)",
      verdict: "BELOW STANDARD — STAND ASIDE",
      subtext: "Setup lacks key confluence. Do not enter. Wait.",
    };
  if (pct >= 0.35)
    return {
      letter: "D",
      colorClass: "cd",
      barColorVar: "var(--g-d)",
      verdict: "WEAK SETUP — NO TRADE",
      subtext: "Too many criteria unconfirmed. Stay flat. Protect your capital.",
    };
  return {
    letter: "F",
    colorClass: "cf",
    barColorVar: "var(--g-f)",
    verdict: "DO NOT TRADE — STAY FLAT",
    subtext: "Setup does not qualify. Wait for the Unicorn.",
  };
}

export const RISK_PCT: Record<string, number> = { "A+": 0.4, A: 0.35, B: 0.25 };
export const RISK_COLOR_CLASS: Record<string, string> = {
  "A+": "cap",
  A: "ca",
  B: "cb",
};

// Maps grader criteria to the app's existing (seeded) ConfluenceFactor labels,
// so a graded setup can hand off straight into a trade's confluence tags.
export const CRITERION_TO_CONFLUENCE_LABEL: Partial<Record<CriterionKey, string>> = {
  bias: "Bias",
  dol: "Clear Draw on Liquidity (DOL)",
  liq: "Liquidity Sweep",
  htfpd: "HTF Delivery from FVG",
  pd: "Premium/Discount",
  bb: "Breaker Block w/ Displacement",
  macro: "Macro Time",
};

export const DOL_TARGET_LABELS: Record<string, string> = {
  "5m-ith": "5M ITH/ITL",
  "15m-ith": "15M ITH/ITL",
  irl: "IRL (FVG)",
  lrlr: "LRLR",
  eqhl: "EQH/EQL",
  "session-hl": "Session H/L",
  pdhl: "PDH/PDL",
};

export const HTFPD_LEVEL_LABELS: Record<string, string> = {
  "15m": "15M FVG",
  "1h": "1H FVG",
  "4h": "4H FVG",
};

export const LIQ_SWEPT_LABELS: Record<string, string> = {
  dhl: "Data H/Ls",
  ohl: "Overnight H/L",
  pdhl: "PDH/PDL",
  "4hhl": "4H H/Ls",
  "1hhl": "1H H/Ls",
  "15hl": "15M H/Ls",
  hod: "HOD/LOD",
  "15ohlc": "15M OHLC",
  "1hohlc": "1H OHLC",
};

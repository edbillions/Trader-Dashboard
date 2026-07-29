export interface PreMarketChecklist {
  symbol: string;
  mindsetReset: {
    breaths: boolean;
    stateCheck: boolean;
    boxBreathing: boolean;
    affirmation: boolean;
  };
  sessionAnalysis: {
    hadRecentExpansion: boolean | null;
    expansionNote: string;
    cautionNote: string;
  };
  htf4hStructure: string | null;
  htf1hStructure: string | null;
  dailyRangeLocation: "premium" | "discount" | "equilibrium" | null;
  biasDirection: "bullish" | "bearish" | "neutral" | null;
  drawOnLiquidity: string[];
  liquidityModelingDone: boolean;
  personalCheck: {
    energyOk: boolean | null;
    sleptEnough: boolean | null;
    emotionallyNeutral: boolean | null;
    hasStressor: boolean | null;
    stressorNote: string;
    followingProcess: boolean | null;
  };
}

export function emptyPreMarketChecklist(): PreMarketChecklist {
  return {
    symbol: "",
    mindsetReset: {
      breaths: false,
      stateCheck: false,
      boxBreathing: false,
      affirmation: false,
    },
    sessionAnalysis: {
      hadRecentExpansion: null,
      expansionNote: "",
      cautionNote: "",
    },
    htf4hStructure: null,
    htf1hStructure: null,
    dailyRangeLocation: null,
    biasDirection: null,
    drawOnLiquidity: [],
    liquidityModelingDone: false,
    personalCheck: {
      energyOk: null,
      sleptEnough: null,
      emotionallyNeutral: null,
      hasStressor: null,
      stressorNote: "",
      followingProcess: null,
    },
  };
}

export function parsePreMarketChecklist(raw: string | null): PreMarketChecklist {
  if (!raw) return emptyPreMarketChecklist();
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyPreMarketChecklist(), ...parsed };
  } catch {
    return emptyPreMarketChecklist();
  }
}

export const MINDSET_RESET_ITEMS: {
  key: keyof PreMarketChecklist["mindsetReset"];
  label: string;
}[] = [
  { key: "breaths", label: "5 deep nasal breaths" },
  {
    key: "stateCheck",
    label: 'State check: "Am I calm, objective, and process-focused?"',
  },
  { key: "boxBreathing", label: "2 minutes box breathing (if needed)" },
  { key: "affirmation", label: 'Affirmation: "Today I follow my rules."' },
];

export const STRUCTURE_OPTIONS: {
  key: string;
  label: string;
  bias: string;
}[] = [
  { key: "back-into-range-bullish", label: "Back Into Range (Reversal)", bias: "Bullish" },
  { key: "expansion-bullish", label: "Expansion", bias: "Bullish" },
  { key: "expansion-bearish", label: "Expansion", bias: "Bearish" },
  { key: "back-into-range-bearish", label: "Back Into Range (Reversal)", bias: "Bearish" },
  { key: "inside-bullish-fvg", label: "Inside Bullish FVG", bias: "Bullish" },
  { key: "below-swing-low", label: "Below Swing Low", bias: "Bullish" },
  { key: "inside-bearish-fvg", label: "Inside Bearish FVG", bias: "Bearish" },
  { key: "above-swing-high", label: "Above Swing High", bias: "Bearish" },
  { key: "none", label: "None of the Above", bias: "Caution — refer to Daily/Daily Range/1H" },
];

export const DOL_OPTIONS: { key: string; label: string; hint: string }[] = [
  {
    key: "prev-session-hl",
    label: "Previous Session High/Low (unswept)",
    hint: "Look left — has session liquidity been swept?",
  },
  {
    key: "relative-smooth-edges",
    label: "Relative Smooth Edges",
    hint: "Are there clear obvious smooth edges?",
  },
  {
    key: "prev-day-hl",
    label: "Previous Day High/Low",
    hint: "Has previous Day High/Low been swept?",
  },
  {
    key: "trendline-liquidity",
    label: "Trendline Liquidity (LRLR)",
    hint: "Is there obvious trend line liquidity to the left?",
  },
  {
    key: "data-hl",
    label: "Data High/Low",
    hint: "Did it make an abnormal/giant wick @ 8:30am? (Check 1M)",
  },
];

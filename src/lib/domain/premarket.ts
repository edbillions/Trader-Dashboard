// Deterministic guarantee that the bullish/bearish/range split always sums to exactly
// 100, regardless of what the AI returns — largest-remainder rounding on a normalized split.
export function normalizeBiasPercentages(
  bullish: number,
  bearish: number,
  range: number,
): { bullishPct: number; bearishPct: number; rangePct: number } {
  const clamped = [bullish, bearish, range].map((n) => Math.max(0, n || 0));
  const sum = clamped.reduce((a, b) => a + b, 0);
  const scaled = sum > 0 ? clamped.map((n) => (n / sum) * 100) : [100 / 3, 100 / 3, 100 / 3];

  const floors = scaled.map(Math.floor);
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);

  const order = scaled
    .map((v, i) => [v - Math.floor(v), i] as const)
    .sort((a, b) => b[0] - a[0]);

  const result = [...floors];
  for (let i = 0; i < remainder; i++) {
    result[order[i][1]]++;
  }

  return { bullishPct: result[0], bearishPct: result[1], rangePct: result[2] };
}

export interface LearningSystemDimension {
  label: string;
  avgScore: number | null;
  sampleSize: number;
}

export interface LearningSystemStats {
  instrument: string;
  windowDays: number;
  bias: LearningSystemDimension;
  liquidity: LearningSystemDimension;
  fvg: LearningSystemDimension;
  target: LearningSystemDimension;
  narrative: LearningSystemDimension;
  overall: LearningSystemDimension;
}

function avgOf(values: number[]): number | null {
  return values.length > 0
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    : null;
}

export function computeLearningSystemStats(
  instrument: string,
  windowDays: number,
  reviews: {
    biasAccuracyScore: number;
    liquidityAccuracyScore: number;
    fvgAccuracyScore: number;
    targetAccuracyScore: number;
    narrativeAccuracyScore: number;
    overallAccuracyScore: number;
  }[],
): LearningSystemStats {
  function dimension(label: string, values: number[]): LearningSystemDimension {
    return { label, avgScore: avgOf(values), sampleSize: values.length };
  }

  return {
    instrument,
    windowDays,
    bias: dimension("Bias Accuracy", reviews.map((r) => r.biasAccuracyScore)),
    liquidity: dimension("Liquidity Accuracy", reviews.map((r) => r.liquidityAccuracyScore)),
    fvg: dimension("FVG Accuracy", reviews.map((r) => r.fvgAccuracyScore)),
    target: dimension("Target Accuracy", reviews.map((r) => r.targetAccuracyScore)),
    narrative: dimension("Narrative Accuracy", reviews.map((r) => r.narrativeAccuracyScore)),
    overall: dimension("Overall Accuracy", reviews.map((r) => r.overallAccuracyScore)),
  };
}

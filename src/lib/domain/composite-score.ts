function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Normalizes profit factor onto a 0-100 scale for the radar chart: 1.0
// (breakeven) maps to 50, 3.0+ maps to 100, 0 maps to 0.
function normalizeProfitFactor(pf: number | null) {
  if (pf == null || !Number.isFinite(pf)) return 0;
  return clamp((pf / 3) * 100, 0, 100);
}

// Normalizes avg win / avg loss ratio: 1:1 maps to 50, 3:1+ maps to 100.
function normalizeWinLossRatio(ratio: number | null) {
  if (ratio == null || !Number.isFinite(ratio)) return 0;
  return clamp((ratio / 3) * 100, 0, 100);
}

export interface CompositeScoreInputs {
  winRate: number | null; // 0-100
  profitFactor: number | null;
  avgWinLossRatio: number | null;
  disciplineScore: number | null; // 0-100
}

export interface CompositeScoreResult {
  overall: number | null;
  breakdown: {
    winRate: number;
    profitFactor: number;
    avgWinLoss: number;
    discipline: number;
  };
}

export function computeCompositeScore(
  inputs: CompositeScoreInputs,
): CompositeScoreResult {
  const breakdown = {
    winRate: inputs.winRate ?? 0,
    profitFactor: normalizeProfitFactor(inputs.profitFactor),
    avgWinLoss: normalizeWinLossRatio(inputs.avgWinLossRatio),
    discipline: inputs.disciplineScore ?? 0,
  };

  const values = Object.values(breakdown);
  const overall = values.reduce((a, b) => a + b, 0) / values.length;

  return { overall, breakdown };
}

export interface SimulationPoint {
  step: number;
  p10: number;
  median: number;
  p90: number;
}

export interface SimulationSummary {
  points: SimulationPoint[];
  finalMedian: number;
  finalP10: number;
  finalP90: number;
  probNetPositive: number;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((p / 100) * sorted.length)),
  );
  return sorted[idx];
}

// Bootstrap resampling (with replacement) from the trader's actual
// historical R-multiples — preserves the real variance/shape of outcomes
// rather than assuming a parametric distribution.
export function runMonteCarloSimulation(
  historicalOutcomes: number[],
  numTrades: number,
  numSimulations: number,
): SimulationSummary {
  const allPaths: number[][] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < numTrades; i++) {
      const randomIndex = Math.floor(Math.random() * historicalOutcomes.length);
      cumulative += historicalOutcomes[randomIndex];
      path.push(cumulative);
    }
    allPaths.push(path);
  }

  const points: SimulationPoint[] = [];
  for (let step = 0; step < numTrades; step++) {
    const valuesAtStep = allPaths.map((p) => p[step]).sort((a, b) => a - b);
    points.push({
      step: step + 1,
      p10: Math.round(percentile(valuesAtStep, 10) * 100) / 100,
      median: Math.round(percentile(valuesAtStep, 50) * 100) / 100,
      p90: Math.round(percentile(valuesAtStep, 90) * 100) / 100,
    });
  }

  const finals = allPaths.map((p) => p[p.length - 1]).sort((a, b) => a - b);
  const probNetPositive =
    (finals.filter((f) => f > 0).length / finals.length) * 100;

  return {
    points,
    finalMedian: percentile(finals, 50),
    finalP10: percentile(finals, 10),
    finalP90: percentile(finals, 90),
    probNetPositive,
  };
}

// Live Session: an additive letter-grade display on top of the existing
// scorecardTotal() (0-50 scale) — additive alongside scorecardBand(), not a
// replacement for it.

export interface SessionGrade {
  letter: "A" | "B" | "C" | "D";
  tagline: string;
}

export function scoreToLetterGrade(total: number): SessionGrade {
  if (total >= 45) return { letter: "A", tagline: "Disciplined day" };
  if (total >= 38) return { letter: "B", tagline: "Solid execution" };
  if (total >= 30) return { letter: "C", tagline: "Some slippage" };
  return { letter: "D", tagline: "Audit needed" };
}

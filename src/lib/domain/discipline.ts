const GRADE_SCORES: Record<string, number> = {
  "A+": 100,
  A: 90,
  B: 75,
  C: 50,
};

export function gradeToScore(grade: string | null | undefined) {
  if (!grade) return null;
  return GRADE_SCORES[grade] ?? null;
}

export interface DisciplineDayInput {
  planAdherenceGrade: string | null;
  maxLossPlan: number | null;
  ruleViolationCount: number;
  trades: { setupGrade: string | null; netPnl: number | null }[];
}

// Discipline score blends four inputs the user chose (plan adherence, rule
// violations, setup grade quality, risk-plan adherence), each 0-100,
// averaged over whichever are available for that day. A day with no
// applicable inputs returns null rather than a misleading 0.
export function computeDayDisciplineScore(
  day: DisciplineDayInput,
): number | null {
  const components: number[] = [];

  const planScore = gradeToScore(day.planAdherenceGrade);
  if (planScore != null) components.push(planScore);

  components.push(Math.max(0, 100 - day.ruleViolationCount * 15));

  const gradeScores = day.trades
    .map((t) => gradeToScore(t.setupGrade))
    .filter((s): s is number => s != null);
  if (gradeScores.length > 0) {
    components.push(
      gradeScores.reduce((a, b) => a + b, 0) / gradeScores.length,
    );
  }

  if (day.maxLossPlan != null && day.maxLossPlan > 0) {
    const dayNetPnl = day.trades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
    const withinPlan = dayNetPnl >= -Math.abs(day.maxLossPlan);
    components.push(withinPlan ? 100 : 40);
  }

  if (components.length === 0) return null;
  return components.reduce((a, b) => a + b, 0) / components.length;
}

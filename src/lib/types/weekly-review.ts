export interface GradeCategory {
  key: string;
  label: string;
  max: number;
}

export type GradeScores = Record<string, number | null>;

function emptyScores(categories: GradeCategory[]): GradeScores {
  return Object.fromEntries(categories.map((c) => [c.key, null]));
}

function parseScores(raw: string | null, categories: GradeCategory[]): GradeScores {
  if (!raw) return emptyScores(categories);
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyScores(categories), ...parsed };
  } catch {
    return emptyScores(categories);
  }
}

function scoresTotal(scores: GradeScores, categories: GradeCategory[]): number {
  return categories.reduce((sum, c) => {
    const value = scores[c.key];
    if (value == null) return sum;
    return sum + Math.min(Math.max(value, 0), c.max);
  }, 0);
}

// ---------- Process Score (weekly only) ----------

export const PROCESS_SCORE_CATEGORIES: GradeCategory[] = [
  { key: "preparation", label: "Preparation", max: 10 },
  { key: "execution", label: "Execution", max: 10 },
  { key: "discipline", label: "Discipline", max: 10 },
  { key: "emotionalControl", label: "Emotional Control", max: 10 },
];

export function emptyProcessScore(): GradeScores {
  return emptyScores(PROCESS_SCORE_CATEGORIES);
}
export function parseProcessScore(raw: string | null): GradeScores {
  return parseScores(raw, PROCESS_SCORE_CATEGORIES);
}
export function processScoreTotal(scores: GradeScores): number {
  return scoresTotal(scores, PROCESS_SCORE_CATEGORIES);
}

// ---------- Confidence Scores (weekly only) ----------

export const CONFIDENCE_SCORE_CATEGORIES: GradeCategory[] = [
  { key: "preparation", label: "Preparation", max: 10 },
  { key: "execution", label: "Execution", max: 10 },
  { key: "psychology", label: "Psychology", max: 10 },
  { key: "patience", label: "Patience", max: 10 },
  { key: "risk", label: "Risk", max: 10 },
  { key: "consistency", label: "Consistency", max: 10 },
  { key: "overall", label: "Overall", max: 10 },
];

export function emptyConfidenceScores(): GradeScores {
  return emptyScores(CONFIDENCE_SCORE_CATEGORIES);
}
export function parseConfidenceScores(raw: string | null): GradeScores {
  return parseScores(raw, CONFIDENCE_SCORE_CATEGORIES);
}
export function confidenceScoresTotal(scores: GradeScores): number {
  return scoresTotal(scores, CONFIDENCE_SCORE_CATEGORIES);
}

// ---------- Period Grade (week + rollup) ----------

export const PERIOD_GRADE_CATEGORIES: GradeCategory[] = [
  { key: "preparation", label: "Preparation", max: 10 },
  { key: "analysis", label: "Analysis", max: 10 },
  { key: "execution", label: "Execution", max: 10 },
  { key: "riskManagement", label: "Risk Management", max: 10 },
  { key: "psychology", label: "Psychology", max: 10 },
  { key: "consistency", label: "Consistency", max: 10 },
  { key: "overall", label: "Overall", max: 10 },
];

export interface PeriodGradeAiSuggestion {
  tone: "strong" | "neutral" | "weak";
  assessment: string;
}

export interface PeriodGrade {
  scores: GradeScores;
  aiSuggestion: PeriodGradeAiSuggestion | null;
}

export function emptyPeriodGrade(): PeriodGrade {
  return { scores: emptyScores(PERIOD_GRADE_CATEGORIES), aiSuggestion: null };
}
export function parsePeriodGrade(raw: string | null): PeriodGrade {
  if (!raw) return emptyPeriodGrade();
  try {
    const parsed = JSON.parse(raw);
    return {
      scores: { ...emptyScores(PERIOD_GRADE_CATEGORIES), ...parsed.scores },
      aiSuggestion: parsed.aiSuggestion ?? null,
    };
  } catch {
    return emptyPeriodGrade();
  }
}
export function periodGradeTotal(scores: GradeScores): number {
  return scoresTotal(scores, PERIOD_GRADE_CATEGORIES);
}

// ---------- Decision Quality Score (weekly only, uneven weights) ----------

export const DECISION_QUALITY_CATEGORIES: GradeCategory[] = [
  { key: "preparation", label: "Preparation", max: 20 },
  { key: "htfBias", label: "HTF Bias", max: 15 },
  { key: "setup", label: "Setup", max: 20 },
  { key: "entry", label: "Entry", max: 20 },
  { key: "risk", label: "Risk", max: 15 },
  { key: "emotionalControl", label: "Emotional Control", max: 10 },
];

export function emptyDecisionQualityScore(): GradeScores {
  return emptyScores(DECISION_QUALITY_CATEGORIES);
}
export function parseDecisionQualityScore(raw: string | null): GradeScores {
  return parseScores(raw, DECISION_QUALITY_CATEGORIES);
}
export function decisionQualityTotal(scores: GradeScores): number {
  return scoresTotal(scores, DECISION_QUALITY_CATEGORIES);
}

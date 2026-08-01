// Narrative and list-shaped Review sections — JSON blobs on PeriodReview.
// Each parse function falls back to an empty shape on null/parse failure,
// matching the defensive style of parseScorecard/parsePreMarketChecklist.

export interface TradeBreakdownEntry {
  whatWentWell: string | null;
  improvements: string | null;
  executionScore: number | null; // 1-10
  confidenceScore: number | null; // 1-10
}
export type TradeBreakdown = Record<string, TradeBreakdownEntry>; // keyed by Trade.id

export function emptyTradeBreakdownEntry(): TradeBreakdownEntry {
  return {
    whatWentWell: null,
    improvements: null,
    executionScore: null,
    confidenceScore: null,
  };
}

export function parseTradeBreakdown(raw: string | null): TradeBreakdown {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export interface OpportunityReview {
  narrative: string | null;
}
export function parseOpportunityReview(raw: string | null): OpportunityReview {
  if (!raw) return { narrative: null };
  try {
    const parsed = JSON.parse(raw);
    return { narrative: parsed.narrative ?? null };
  } catch {
    return { narrative: null };
  }
}

export interface ScreenshotReviewPicks {
  bestTradeId: string | null;
  bestTradeScreenshotId: string | null;
  worstTradeId: string | null;
  worstTradeScreenshotId: string | null;
  bestMissedSetupNote: string | null;
  biggestMistakeTradeId: string | null;
  biggestMistakeScreenshotId: string | null;
}
export function emptyScreenshotReviewPicks(): ScreenshotReviewPicks {
  return {
    bestTradeId: null,
    bestTradeScreenshotId: null,
    worstTradeId: null,
    worstTradeScreenshotId: null,
    bestMissedSetupNote: null,
    biggestMistakeTradeId: null,
    biggestMistakeScreenshotId: null,
  };
}
export function parseScreenshotReview(raw: string | null): ScreenshotReviewPicks {
  if (!raw) return emptyScreenshotReviewPicks();
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyScreenshotReviewPicks(), ...parsed };
  } catch {
    return emptyScreenshotReviewPicks();
  }
}

export interface MistakeTrackerSummary {
  costliestMistakeLabel: string | null;
  narrative: string | null;
}
export function parseMistakeTracker(raw: string | null): MistakeTrackerSummary {
  if (!raw) return { costliestMistakeLabel: null, narrative: null };
  try {
    const parsed = JSON.parse(raw);
    return {
      costliestMistakeLabel: parsed.costliestMistakeLabel ?? null,
      narrative: parsed.narrative ?? null,
    };
  } catch {
    return { costliestMistakeLabel: null, narrative: null };
  }
}

export interface RuleViolationsSummary {
  narrative: string | null;
}
export function parseRuleViolationsSummary(raw: string | null): RuleViolationsSummary {
  if (!raw) return { narrative: null };
  try {
    const parsed = JSON.parse(raw);
    return { narrative: parsed.narrative ?? null };
  } catch {
    return { narrative: null };
  }
}

export interface PatternRecognitionSummary {
  narrative: string | null;
}
export function parsePatternRecognition(raw: string | null): PatternRecognitionSummary {
  if (!raw) return { narrative: null };
  try {
    const parsed = JSON.parse(raw);
    return { narrative: parsed.narrative ?? null };
  } catch {
    return { narrative: null };
  }
}

export interface PlaybookUpdate {
  notes: string | null;
}
export function parsePlaybookUpdate(raw: string | null): PlaybookUpdate {
  if (!raw) return { notes: null };
  try {
    const parsed = JSON.parse(raw);
    return { notes: parsed.notes ?? null };
  } catch {
    return { notes: null };
  }
}

export interface CeoQuestions {
  mostProfit: string | null;
  mostCost: string | null;
  repeatingPattern: string | null;
  oneHabit: string | null;
  satisfiedIfIdentical: string | null;
}
export function emptyCeoQuestions(): CeoQuestions {
  return {
    mostProfit: null,
    mostCost: null,
    repeatingPattern: null,
    oneHabit: null,
    satisfiedIfIdentical: null,
  };
}
export function parseCeoQuestions(raw: string | null): CeoQuestions {
  if (!raw) return emptyCeoQuestions();
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyCeoQuestions(), ...parsed };
  } catch {
    return emptyCeoQuestions();
  }
}

// Lessons Learned / Action Items share one shape: up to 3 free-text strings.
export function parseThreeItems(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string").slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

import type { PreMarketChecklist } from "@/lib/types/premarket-checklist";
import { emptyPreMarketChecklist } from "@/lib/types/premarket-checklist";
import type { ScorecardScores } from "@/lib/types/scorecard";
import { emptyScorecard } from "@/lib/types/scorecard";

export interface TradeInput {
  id?: string;
  accountId: string | null;
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number | null;
  entryTime: string;
  exitTime: string | null;
  stopLossPlanned: number | null;
  stopLossActual: number | null;
  targetPlanned: number | null;
  targetActual: number | null;
  positionSize: number;
  commission: number | null;
  htfTimeframe: string;
  intermediateTimeframe: string;
  entryTimeframe: string;
  entryModel: string;
  session: string;
  setupGrade: string;
  dailyBias: string;
  htfPoi: string;
  htfDol: string;
  mfeR: number | null;
  maeR: number | null;
  writeup: string;
  confluenceFactorIds: string[];
  mistakeIds: string[];
  tagIds: string[]; // at most one TagOption id per TagCategory, enforced on save
  screenshotPaths: string[];
}

export interface MissedTradeInput {
  id?: string;
  symbol: string;
  setupDescription: string;
  reasonMissed: string;
  entryModel: string;
  session: string;
  estimatedRMultiple: number | null;
  confluenceFactorIds: string[];
  tagIds: string[];
}

export interface SaveTradingDayInput {
  date: string;
  htfBias: string;
  keyLevels: string;
  sessionTiming: string;
  news: string;
  maxLossPlan: number | null;
  positionSizePlan: string;
  maxTradeCountPlan: number | null;
  planScreenshotPaths: string[];
  preMarketChecklist: PreMarketChecklist;
  trades: TradeInput[];
  missedTrades: MissedTradeInput[];
  planAdherenceGrade: string;
  psychologyLog: string;
  freeformNotes: string;
  scorecard: ScorecardScores;
  ruleViolationIds: string[];
}

export function emptyTrade(): TradeInput {
  return {
    accountId: null,
    symbol: "",
    direction: "long",
    entryPrice: NaN,
    exitPrice: null,
    entryTime: "",
    exitTime: null,
    stopLossPlanned: null,
    stopLossActual: null,
    targetPlanned: null,
    targetActual: null,
    positionSize: 1,
    commission: null,
    htfTimeframe: "",
    intermediateTimeframe: "",
    entryTimeframe: "",
    entryModel: "",
    session: "",
    setupGrade: "",
    dailyBias: "",
    htfPoi: "",
    htfDol: "",
    mfeR: null,
    maeR: null,
    writeup: "",
    confluenceFactorIds: [],
    mistakeIds: [],
    tagIds: [],
    screenshotPaths: [],
  };
}

export function emptyMissedTrade(): MissedTradeInput {
  return {
    symbol: "",
    setupDescription: "",
    reasonMissed: "",
    entryModel: "",
    session: "",
    estimatedRMultiple: null,
    confluenceFactorIds: [],
    tagIds: [],
  };
}

export function emptyTradingDay(date: string): SaveTradingDayInput {
  return {
    date,
    htfBias: "",
    keyLevels: "",
    sessionTiming: "",
    news: "",
    maxLossPlan: null,
    positionSizePlan: "",
    maxTradeCountPlan: null,
    planScreenshotPaths: [],
    preMarketChecklist: emptyPreMarketChecklist(),
    trades: [],
    missedTrades: [],
    planAdherenceGrade: "",
    psychologyLog: "",
    freeformNotes: "",
    scorecard: emptyScorecard(),
    ruleViolationIds: [],
  };
}

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
  writeup: string;
  confluenceFactorIds: string[];
  mistakeIds: string[];
  screenshotPaths: string[];
}

export interface MissedTradeInput {
  id?: string;
  symbol: string;
  setupDescription: string;
  reasonMissed: string;
  entryModel: string;
  session: string;
  confluenceFactorIds: string[];
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
  trades: TradeInput[];
  missedTrades: MissedTradeInput[];
  planAdherenceGrade: string;
  psychologyLog: string;
  freeformNotes: string;
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
    writeup: "",
    confluenceFactorIds: [],
    mistakeIds: [],
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
    confluenceFactorIds: [],
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
    trades: [],
    missedTrades: [],
    planAdherenceGrade: "",
    psychologyLog: "",
    freeformNotes: "",
    ruleViolationIds: [],
  };
}

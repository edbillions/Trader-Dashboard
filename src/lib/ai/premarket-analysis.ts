import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";

export type Instrument = "NQ" | "ES";
export type Timeframe = "1h" | "15m" | "1m";

export interface ChartImageInput {
  timeframe: Timeframe;
  base64: string;
}

// ---------- Call 1: raw ICT read (vision) ----------

export interface FvgEntry {
  direction: "bullish" | "bearish";
  priceRange: string;
  rank: number;
  alignsWithHtfBias: boolean;
  notes: string;
}

export interface IctRead {
  htfBias: {
    marketStructure: string;
    swingHighs: string[];
    swingLows: string[];
    premiumDiscount: "premium" | "discount" | "equilibrium";
    dailyOpen: string;
    weeklyOpen: string;
    previousDayHigh: string;
    previousDayLow: string;
    currentDrawOnLiquidity: string;
    htfFairValueGapsSummary: string;
    orderFlow: string;
    direction: "bullish" | "bearish";
    confidence: number;
  };
  liquidity: {
    buySideLiquidity: string[];
    sellSideLiquidity: string[];
    equalHighs: string[];
    equalLows: string[];
    internalLiquidity: string[];
    externalLiquidity: string[];
    sweeps: string[];
    stopHunts: string[];
    expectedDrawOnLiquidity: string;
    erlIrlNarrative: string;
  };
  fairValueGaps: {
    oneHour: FvgEntry[];
    fifteenMinute: FvgEntry[];
  };
  premiumDiscount: {
    zone: "premium" | "discount" | "equilibrium";
    currentPriceContext: string;
  };
}

const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  "1h": "1 Hour chart (establishes directional bias)",
  "15m": "15 Minute chart (establishes context)",
  "1m": "1 Minute chart (execution only — do not read structure/bias from this one)",
};

const ICT_SYSTEM_PROMPT =
  "You are a trading assistant reading futures charts for a discretionary NQ/ES day " +
  "trader who runs the ICT Unicorn Model. You will be shown three chart screenshots — " +
  "1 Hour, 15 Minute, and 1 Minute. The 1 Hour establishes directional bias, the 15 " +
  "Minute establishes context, and the 1 Minute is execution-only (never use it to read " +
  "structure or bias). Analyze strictly what is visible in the images — never invent a " +
  "price level, wick, or structure you cannot actually see.\n\n" +
  "For Higher Timeframe Bias, determine bullish or bearish and analyze: market " +
  "structure, swing highs, swing lows, premium/discount, daily open, weekly open, " +
  "previous day high, previous day low, the current draw on liquidity, higher-timeframe " +
  "Fair Value Gaps, and order flow. Attach a confidence score (0-100).\n\n" +
  "For Liquidity, identify buy-side liquidity, sell-side liquidity, equal highs, equal " +
  "lows, internal liquidity, external liquidity, liquidity sweeps, stop hunts, and the " +
  "expected draw on liquidity. Apply the Juno ERL/IRL model explicitly: mark External " +
  "Range Liquidity (ERL) at the top and bottom of the visible range, and the clearest " +
  "FVG/imbalance inside that range as Internal Range Liquidity (IRL). After price sweeps " +
  "one ERL and shows a reaction, expect a draw toward the IRL, then onward toward the " +
  "opposite ERL. Write the erlIrlNarrative field using this external→internal→external " +
  "logic explicitly, naming which ERL was or will likely be swept and which IRL is the " +
  "interim draw.\n\n" +
  "For Fair Value Gaps, locate 1H and 15M FVGs, rank each by importance (1 = most " +
  "important), and flag which ones align with the HTF bias direction.\n\n" +
  "For Premium/Discount, determine whether price currently sits in premium, discount, or " +
  "equilibrium relative to the visible range, and describe where price currently sits.\n\n" +
  "All price levels are approximate reads off a chart image, not tick-precise data — " +
  "describe them the way a discretionary trader would (e.g. 'around 21,450' or 'just " +
  "above the London low'), not as if from a live feed.";

export async function runIctRead(
  instrument: Instrument,
  images: ChartImageInput[],
): Promise<IctRead | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }
  > = [
    {
      type: "text",
      text: `Instrument: ${instrument}. Run the full ICT Unicorn Model pre-market checklist against these three timeframes.`,
    },
  ];
  for (const img of images) {
    content.push({ type: "text", text: `${TIMEFRAME_LABEL[img.timeframe]}:` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: img.base64 },
    });
  }

  const fvgItemSchema = {
    type: "object",
    properties: {
      direction: { type: "string", enum: ["bullish", "bearish"] },
      priceRange: { type: "string" },
      rank: { type: "number" },
      alignsWithHtfBias: { type: "boolean" },
      notes: { type: "string" },
    },
    required: ["direction", "priceRange", "rank", "alignsWithHtfBias", "notes"],
    additionalProperties: false,
  };

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 4096,
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            htfBias: {
              type: "object",
              properties: {
                marketStructure: { type: "string" },
                swingHighs: { type: "array", items: { type: "string" } },
                swingLows: { type: "array", items: { type: "string" } },
                premiumDiscount: {
                  type: "string",
                  enum: ["premium", "discount", "equilibrium"],
                },
                dailyOpen: { type: "string" },
                weeklyOpen: { type: "string" },
                previousDayHigh: { type: "string" },
                previousDayLow: { type: "string" },
                currentDrawOnLiquidity: { type: "string" },
                htfFairValueGapsSummary: { type: "string" },
                orderFlow: { type: "string" },
                direction: { type: "string", enum: ["bullish", "bearish"] },
                confidence: { type: "number" },
              },
              required: [
                "marketStructure",
                "swingHighs",
                "swingLows",
                "premiumDiscount",
                "dailyOpen",
                "weeklyOpen",
                "previousDayHigh",
                "previousDayLow",
                "currentDrawOnLiquidity",
                "htfFairValueGapsSummary",
                "orderFlow",
                "direction",
                "confidence",
              ],
              additionalProperties: false,
            },
            liquidity: {
              type: "object",
              properties: {
                buySideLiquidity: { type: "array", items: { type: "string" } },
                sellSideLiquidity: { type: "array", items: { type: "string" } },
                equalHighs: { type: "array", items: { type: "string" } },
                equalLows: { type: "array", items: { type: "string" } },
                internalLiquidity: { type: "array", items: { type: "string" } },
                externalLiquidity: { type: "array", items: { type: "string" } },
                sweeps: { type: "array", items: { type: "string" } },
                stopHunts: { type: "array", items: { type: "string" } },
                expectedDrawOnLiquidity: { type: "string" },
                erlIrlNarrative: { type: "string" },
              },
              required: [
                "buySideLiquidity",
                "sellSideLiquidity",
                "equalHighs",
                "equalLows",
                "internalLiquidity",
                "externalLiquidity",
                "sweeps",
                "stopHunts",
                "expectedDrawOnLiquidity",
                "erlIrlNarrative",
              ],
              additionalProperties: false,
            },
            fairValueGaps: {
              type: "object",
              properties: {
                oneHour: { type: "array", items: fvgItemSchema },
                fifteenMinute: { type: "array", items: fvgItemSchema },
              },
              required: ["oneHour", "fifteenMinute"],
              additionalProperties: false,
            },
            premiumDiscount: {
              type: "object",
              properties: {
                zone: { type: "string", enum: ["premium", "discount", "equilibrium"] },
                currentPriceContext: { type: "string" },
              },
              required: ["zone", "currentPriceContext"],
              additionalProperties: false,
            },
          },
          required: ["htfBias", "liquidity", "fairValueGaps", "premiumDiscount"],
          additionalProperties: false,
        },
      },
    },
    system: ICT_SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    return JSON.parse(textBlock.text) as IctRead;
  } catch {
    return null;
  }
}

// ---------- Call 2: Daily Bias Engine + Trade Plan synthesis (text-only) ----------

export interface TradeScenario {
  scenario: "A" | "B" | "C";
  label: "Bullish" | "Bearish" | "Range";
  whatPriceMustDo: string;
  whatToWaitFor: string;
  whatConfirmsEntry: string;
  whereRiskInvalid: string;
}

export interface DailyBiasSynthesis {
  bullishPct: number;
  bearishPct: number;
  rangePct: number;
  overallBias: "bullish" | "bearish" | "range";
  confidence: number;
  reasoning: string;
  expectedNarrative: string;
  invalidationLevel: string;
  primaryTarget: string;
  secondaryTarget: string;
  tradeable: boolean;
  noTradeReason: string;
  scenarios: TradeScenario[];
}

const SCENARIO_KEYS = ["A", "B", "C"] as const;

export async function runDailyBiasSynthesis(
  instrument: Instrument,
  ictRead: IctRead,
): Promise<DailyBiasSynthesis | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 3072,
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            bullishPct: { type: "number" },
            bearishPct: { type: "number" },
            rangePct: { type: "number" },
            overallBias: { type: "string", enum: ["bullish", "bearish", "range"] },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            expectedNarrative: { type: "string" },
            invalidationLevel: { type: "string" },
            primaryTarget: { type: "string" },
            secondaryTarget: { type: "string" },
            tradeable: { type: "boolean" },
            noTradeReason: { type: "string" },
            scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scenario: { type: "string", enum: ["A", "B", "C"] },
                  label: { type: "string", enum: ["Bullish", "Bearish", "Range"] },
                  whatPriceMustDo: { type: "string" },
                  whatToWaitFor: { type: "string" },
                  whatConfirmsEntry: { type: "string" },
                  whereRiskInvalid: { type: "string" },
                },
                required: [
                  "scenario",
                  "label",
                  "whatPriceMustDo",
                  "whatToWaitFor",
                  "whatConfirmsEntry",
                  "whereRiskInvalid",
                ],
                additionalProperties: false,
              },
            },
          },
          required: [
            "bullishPct",
            "bearishPct",
            "rangePct",
            "overallBias",
            "confidence",
            "reasoning",
            "expectedNarrative",
            "invalidationLevel",
            "primaryTarget",
            "secondaryTarget",
            "tradeable",
            "noTradeReason",
            "scenarios",
          ],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are synthesizing a Daily Bias Engine output for a discretionary ICT Unicorn " +
      "Model futures trader, from a structured ICT chart read you're given as JSON (no " +
      "charts to look at here — reason only from the given data). Produce bullishPct, " +
      "bearishPct, and rangePct as your best-judgment probability split (they don't need " +
      "to sum to exactly 100 — the app normalizes them). Then produce an overall bias, a " +
      "confidence score (0-100), reasoning, an expected narrative for the session, an " +
      "invalidation level, and a primary + secondary target (all price-level fields as " +
      "approximate text, matching the input's style). Set tradeable=false and explain in " +
      "noTradeReason whenever the setup is genuinely unclear, conflicting across " +
      "timeframes, or low-conviction — never force a trade recommendation just to have " +
      "one; quality over quantity. When tradeable=true, leave noTradeReason as an empty " +
      "string. Produce EXACTLY 3 trade scenarios: scenario A labeled Bullish, scenario B " +
      "labeled Bearish, scenario C labeled Range — each explaining what price must do, " +
      "what to wait for, what confirms entry, and where risk becomes invalid, even for " +
      "scenarios you consider unlikely today.",
    messages: [{ role: "user", content: JSON.stringify(ictRead) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as DailyBiasSynthesis;
    const keys = new Set(parsed.scenarios.map((s) => s.scenario));
    const hasAllScenarios = SCENARIO_KEYS.every((k) => keys.has(k));
    if (parsed.scenarios.length !== 3 || !hasAllScenarios) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---------- Call 3: end-of-day Daily Review grading (vision + text) ----------

export interface DailyReviewGrading {
  actualPriceActionSummary: string;
  biasCorrect: boolean;
  biasAccuracyScore: number;
  biasNotes: string;
  liquidityAccuracyScore: number;
  liquidityNotes: string;
  fvgAccuracyScore: number;
  fvgNotes: string;
  targetAccuracyScore: number;
  targetNotes: string;
  narrativeAccuracyScore: number;
  narrativeNotes: string;
  overallAccuracyScore: number;
  overallSummary: string;
}

export async function runDailyReviewGrading(
  instrument: Instrument,
  morningAnalysisSummary: string,
  eodImages: ChartImageInput[],
): Promise<DailyReviewGrading | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }
  > = [
    {
      type: "text",
      text:
        `Instrument: ${instrument}. Here is this morning's pre-market analysis:\n\n` +
        `${morningAnalysisSummary}\n\nHere is how the session actually played out — grade the ` +
        "prediction against these end-of-day charts.",
    },
  ];
  for (const img of eodImages) {
    content.push({ type: "text", text: `${TIMEFRAME_LABEL[img.timeframe]} (end of day):` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: img.base64 },
    });
  }

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            actualPriceActionSummary: { type: "string" },
            biasCorrect: { type: "boolean" },
            biasAccuracyScore: { type: "number" },
            biasNotes: { type: "string" },
            liquidityAccuracyScore: { type: "number" },
            liquidityNotes: { type: "string" },
            fvgAccuracyScore: { type: "number" },
            fvgNotes: { type: "string" },
            targetAccuracyScore: { type: "number" },
            targetNotes: { type: "string" },
            narrativeAccuracyScore: { type: "number" },
            narrativeNotes: { type: "string" },
            overallAccuracyScore: { type: "number" },
            overallSummary: { type: "string" },
          },
          required: [
            "actualPriceActionSummary",
            "biasCorrect",
            "biasAccuracyScore",
            "biasNotes",
            "liquidityAccuracyScore",
            "liquidityNotes",
            "fvgAccuracyScore",
            "fvgNotes",
            "targetAccuracyScore",
            "targetNotes",
            "narrativeAccuracyScore",
            "narrativeNotes",
            "overallAccuracyScore",
            "overallSummary",
          ],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are grading a discretionary ICT trader's morning pre-market prediction against " +
      "what actually happened, using the end-of-day charts. Summarize the actual price " +
      "action plainly. Answer: was the bias correct? Did liquidity behave as expected " +
      "(were the identified pools swept as anticipated)? Did the Fair Value Gaps hold or " +
      "get violated? Was the primary/secondary target reached? Score each of bias, " +
      "liquidity, FVG, and target/narrative accuracy 0-100 (0 = completely wrong, 100 = " +
      "exactly as predicted), with a short note explaining each score, plus one holistic " +
      "overallAccuracyScore and overallSummary. Be honest and specific — a wrong " +
      "prediction graded low is more useful than a flattering one.",
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as DailyReviewGrading;
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    return {
      ...parsed,
      biasAccuracyScore: clamp(parsed.biasAccuracyScore),
      liquidityAccuracyScore: clamp(parsed.liquidityAccuracyScore),
      fvgAccuracyScore: clamp(parsed.fvgAccuracyScore),
      targetAccuracyScore: clamp(parsed.targetAccuracyScore),
      narrativeAccuracyScore: clamp(parsed.narrativeAccuracyScore),
      overallAccuracyScore: clamp(parsed.overallAccuracyScore),
    };
  } catch {
    return null;
  }
}

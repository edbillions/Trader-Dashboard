import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import type { DecisionIntelligenceInput } from "@/lib/data/decision-intelligence-data";

export type FrequencyVerdict =
  | "trade_less"
  | "trade_more"
  | "keep_same"
  | "insufficient_data";

export interface DecisionIntelligenceResult {
  whyWinnersBigger: string;
  whatChanged: string;
  worstHabit: string;
  expectancyImprovement: string;
  frequency: {
    verdict: FrequencyVerdict;
    explanation: string;
  };
}

export async function generateDecisionIntelligence(
  input: DecisionIntelligenceInput,
): Promise<DecisionIntelligenceResult | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1536,
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            whyWinnersBigger: { type: "string" },
            whatChanged: { type: "string" },
            worstHabit: { type: "string" },
            expectancyImprovement: { type: "string" },
            frequency: {
              type: "object",
              properties: {
                verdict: {
                  type: "string",
                  enum: [
                    "trade_less",
                    "trade_more",
                    "keep_same",
                    "insufficient_data",
                  ],
                },
                explanation: { type: "string" },
              },
              required: ["verdict", "explanation"],
              additionalProperties: false,
            },
          },
          required: [
            "whyWinnersBigger",
            "whatChanged",
            "worstHabit",
            "expectancyImprovement",
            "frequency",
          ],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are a trading decision-intelligence analyst. Answer strictly " +
      "from the given numeric stats — never invent trends or facts not " +
      "implied by the data. If a given field is null or a count is too " +
      "small, say so plainly in that specific answer instead of guessing. " +
      "For whyWinnersBigger, use cohortTrend.avgWinNetPnlDelta and " +
      "avgWinRDelta (not the blended avgRDelta, which conflates win size " +
      "with win rate) — if cohortTrend is null, say there isn't enough " +
      "trade history yet for a recent-vs-prior comparison. For " +
      "whatChanged, summarize the broader deltas in cohortTrend (netPnl, " +
      "win rate, mistake rate) — same null-data caveat applies. For " +
      "worstHabit, use worstMistake — if null, say no single mistake type " +
      "is clearly costing money right now. For expectancyImprovement, use " +
      "expectancyDelta — if null, say there isn't a large enough sample of " +
      "that mistake to estimate the impact. For the frequency question, " +
      "only choose trade_less/trade_more/keep_same if the relevant tiers " +
      "in frequencyImpact show hasEnoughData: true — otherwise choose " +
      "insufficient_data and explain what's missing. Write plain prose, " +
      "2-4 sentences per answer, no markdown, no headers.",
    messages: [{ role: "user", content: JSON.stringify(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as DecisionIntelligenceResult;
    if (
      !parsed.whyWinnersBigger ||
      !parsed.whatChanged ||
      !parsed.worstHabit ||
      !parsed.expectancyImprovement ||
      !parsed.frequency?.verdict ||
      !parsed.frequency?.explanation
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

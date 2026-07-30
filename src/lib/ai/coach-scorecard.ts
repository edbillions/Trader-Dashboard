import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";

export interface ScorecardInput {
  profitability: { winRate: number | null; profitFactor: number | null };
  systemEdge: {
    cleanWinRate: number | null;
    blendedWinRate: number | null;
    winRateGapPct: number | null;
  };
  tradeManagement: {
    hurtCount: number;
    improvedCount: number;
    managementImpactPct: number | null;
  };
  riskManagement: {
    drawdownPct: number | null;
    maxConsecutiveLosses: number;
    largestLoss: number | null;
  };
  tradingProcess: { avgDisciplineScore: number | null };
}

export type ScorecardCategoryName =
  | "Profitability"
  | "True System Edge"
  | "Trade Management"
  | "Risk Management"
  | "Trading Process";

export type ScorecardTone = "strong" | "neutral" | "weak";

export interface ScorecardCategory {
  category: ScorecardCategoryName;
  tone: ScorecardTone;
  assessment: string;
}

const CATEGORY_ORDER: ScorecardCategoryName[] = [
  "Profitability",
  "True System Edge",
  "Trade Management",
  "Risk Management",
  "Trading Process",
];

export async function generateCoachScorecard(
  input: ScorecardInput,
): Promise<ScorecardCategory[] | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string", enum: CATEGORY_ORDER },
                  tone: {
                    type: "string",
                    enum: ["strong", "neutral", "weak"],
                  },
                  assessment: { type: "string" },
                },
                required: ["category", "tone", "assessment"],
                additionalProperties: false,
              },
            },
          },
          required: ["categories"],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are a trading performance coach producing a 5-category " +
      "scorecard from numeric stats only — never invent facts not implied " +
      "by the numbers. For each of Profitability, True System Edge, Trade " +
      "Management, Risk Management, and Trading Process, return exactly " +
      "one entry with a 1-2 sentence assessment (plain prose, no markdown) " +
      "and a tone of strong/neutral/weak based on the numbers. If a " +
      "category's numbers are null/missing, say so plainly and use tone " +
      "'neutral' rather than guessing.",
    messages: [{ role: "user", content: JSON.stringify(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as {
      categories: ScorecardCategory[];
    };
    const byCategory = new Map(
      parsed.categories.map((c) => [c.category, c] as const),
    );
    const ordered = CATEGORY_ORDER.map((name) => byCategory.get(name)).filter(
      (c): c is ScorecardCategory => c != null,
    );
    return ordered.length === CATEGORY_ORDER.length ? ordered : null;
  } catch {
    return null;
  }
}

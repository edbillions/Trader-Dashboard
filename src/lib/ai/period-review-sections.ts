import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import type { GroupStat } from "@/lib/data/analytics";
import type { CeoQuestions } from "@/lib/types/review-sections";

export interface PeriodReflectionInput {
  periodLabel: string;
  isWeekly: boolean;
  scoreboard: {
    tradeCount: number;
    winRate: number | null;
    profitFactor: number | null;
    tradeExpectancy: number | null;
    avgWin: number | null;
    avgLoss: number | null;
    largestProfit: number | null;
    largestLoss: number | null;
    netR: number;
    aPlusSetupsPassed: number;
    ruleViolationCount: number;
  };
  patternRecognition: {
    byDayOfWeek: GroupStat[];
    bySymbol: GroupStat[];
    byDirection: GroupStat[];
    bySession: GroupStat[];
    bySetupGrade: GroupStat[];
  };
  mistakeBreakdown: GroupStat[];
  ruleViolationBreakdown: { label: string; count: number }[];
  missedTrades: {
    symbol: string;
    setupDescription: string | null;
    reasonMissed: string | null;
    estimatedRMultiple: number | null;
  }[];
}

function formatGroupStats(groups: GroupStat[]): string {
  if (groups.length === 0) return "none";
  return groups
    .map(
      (g) =>
        `${g.label}: ${g.count} trades, ${g.winRate != null ? g.winRate.toFixed(0) : "—"}% win rate, ` +
        `$${g.netPnl.toFixed(2)} net`,
    )
    .join("; ");
}

function formatInput(input: PeriodReflectionInput): string {
  const s = input.scoreboard;
  const lines: string[] = [
    `Period: ${input.periodLabel}`,
    `Trades: ${s.tradeCount}, win rate ${s.winRate != null ? s.winRate.toFixed(0) : "—"}%, ` +
      `profit factor ${s.profitFactor != null ? s.profitFactor.toFixed(2) : "—"}, ` +
      `expectancy ${s.tradeExpectancy != null ? s.tradeExpectancy.toFixed(2) : "—"}`,
    `Avg winner $${s.avgWin != null ? s.avgWin.toFixed(2) : "—"}, avg loser $${s.avgLoss != null ? s.avgLoss.toFixed(2) : "—"}, ` +
      `largest win $${s.largestProfit != null ? s.largestProfit.toFixed(2) : "—"}, largest loss $${s.largestLoss != null ? s.largestLoss.toFixed(2) : "—"}`,
    `Net R: ${s.netR.toFixed(2)}, A+ setups passed: ${s.aPlusSetupsPassed}, rule violations: ${s.ruleViolationCount}`,
    `By day of week: ${formatGroupStats(input.patternRecognition.byDayOfWeek)}`,
    `By symbol: ${formatGroupStats(input.patternRecognition.bySymbol)}`,
    `By direction: ${formatGroupStats(input.patternRecognition.byDirection)}`,
    `By session: ${formatGroupStats(input.patternRecognition.bySession)}`,
    `By setup grade: ${formatGroupStats(input.patternRecognition.bySetupGrade)}`,
    `Mistakes (most costly first): ${formatGroupStats(input.mistakeBreakdown)}`,
    `Rule violations by type: ${input.ruleViolationBreakdown.map((v) => `${v.label} (${v.count})`).join(", ") || "none"}`,
  ];
  if (input.isWeekly) {
    lines.push(
      `Missed A+ setups: ${
        input.missedTrades.length === 0
          ? "none"
          : input.missedTrades
              .map(
                (m) =>
                  `${m.symbol} — ${m.setupDescription ?? "no description"} (missed because: ${m.reasonMissed ?? "not specified"}, est. ${m.estimatedRMultiple != null ? `${m.estimatedRMultiple}R` : "—"})`,
              )
              .join("; ")
      }`,
    );
  }
  return lines.join("\n");
}

async function generateText(
  system: string,
  input: PeriodReflectionInput,
): Promise<string | null> {
  const client = await getAnthropicClient();
  if (!client) return null;
  if (input.scoreboard.tradeCount === 0) return null;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    system,
    messages: [{ role: "user", content: formatInput(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text.trim() : null;
}

export async function generateLessonsAndActionItems(
  input: PeriodReflectionInput,
): Promise<{ lessons: string[]; actionItems: string[] } | null> {
  const client = await getAnthropicClient();
  if (!client) return null;
  if (input.scoreboard.tradeCount === 0) return null;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            lessons: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
            actionItems: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
          },
          required: ["lessons", "actionItems"],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are a trading performance coach drafting a periodic review. From " +
      "the given stats and patterns only, write exactly 3 concise lessons " +
      "learned (what the numbers/patterns reveal) and exactly 3 concrete " +
      "action items for next period (specific, testable behaviors — not " +
      "generic advice like 'be more disciplined'). This is a DRAFT the " +
      "trader will edit themselves.",
    messages: [{ role: "user", content: formatInput(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as {
      lessons?: string[];
      actionItems?: string[];
    };
    if (!Array.isArray(parsed.lessons) || !Array.isArray(parsed.actionItems)) {
      return null;
    }
    return {
      lessons: parsed.lessons.slice(0, 3),
      actionItems: parsed.actionItems.slice(0, 3),
    };
  } catch {
    return null;
  }
}

export async function generateMistakeTrackerNarrative(
  input: PeriodReflectionInput,
): Promise<string | null> {
  return generateText(
    "You are a trading performance coach. From the given mistake breakdown " +
      "(sorted most costly first) only, write a 2-3 sentence narrative " +
      "identifying the costliest recurring mistake and its impact. If there " +
      "are no mistakes tagged, say so plainly rather than inventing one.",
    input,
  );
}

export async function generateRuleViolationsNarrative(
  input: PeriodReflectionInput,
): Promise<string | null> {
  return generateText(
    "You are a trading performance coach. From the given rule-violation " +
      "counts only, write a 2-3 sentence narrative on which rule was broken " +
      "most and what that suggests. If there are no violations, say so " +
      "plainly rather than inventing one.",
    input,
  );
}

export async function generatePatternRecognitionNarrative(
  input: PeriodReflectionInput,
): Promise<string | null> {
  return generateText(
    "You are a trading performance coach. From the given day-of-week/" +
      "symbol/direction/session/setup-grade breakdowns only, write a 3-4 " +
      "sentence narrative calling out the clearest best/worst pattern(s) — " +
      "be specific about which bucket and why it stands out. Don't invent " +
      "patterns the numbers don't support.",
    input,
  );
}

export async function generateOpportunityReviewNarrative(
  input: PeriodReflectionInput,
): Promise<string | null> {
  return generateText(
    "You are a trading performance coach. From the given missed A+ setups " +
      "only, write a 2-3 sentence narrative on what was missed and why, " +
      "and whether a pattern shows up across the misses. If there were no " +
      "missed setups, say so plainly.",
    input,
  );
}

export async function generateCeoQuestions(
  input: PeriodReflectionInput,
): Promise<CeoQuestions | null> {
  const client = await getAnthropicClient();
  if (!client) return null;
  if (input.scoreboard.tradeCount === 0) return null;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            mostProfit: { type: "string" },
            mostCost: { type: "string" },
            repeatingPattern: { type: "string" },
            oneHabit: { type: "string" },
            satisfiedIfIdentical: { type: "string" },
          },
          required: [
            "mostProfit",
            "mostCost",
            "repeatingPattern",
            "oneHabit",
            "satisfiedIfIdentical",
          ],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are a trading performance coach running a weekly 'CEO meeting' " +
      "with a trader. Answer each question in 1 sentence, using only the " +
      "given stats/patterns — if the data doesn't clearly support an " +
      "answer, say so plainly rather than inventing one. Questions: " +
      "(1) What generated the most profit? (2) What cost the most money? " +
      "(3) What pattern keeps repeating? (4) What single habit would " +
      "improve next period? (5) If next period looked identical, would the " +
      "trader be satisfied?",
    messages: [{ role: "user", content: formatInput(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as Partial<CeoQuestions>;
    if (
      typeof parsed.mostProfit !== "string" ||
      typeof parsed.mostCost !== "string" ||
      typeof parsed.repeatingPattern !== "string" ||
      typeof parsed.oneHabit !== "string" ||
      typeof parsed.satisfiedIfIdentical !== "string"
    ) {
      return null;
    }
    return parsed as CeoQuestions;
  } catch {
    return null;
  }
}

export async function generatePeriodGradeSuggestion(
  input: PeriodReflectionInput,
): Promise<{ tone: "strong" | "neutral" | "weak"; assessment: string } | null> {
  const client = await getAnthropicClient();
  if (!client) return null;
  if (input.scoreboard.tradeCount === 0) return null;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            tone: { type: "string", enum: ["strong", "neutral", "weak"] },
            assessment: { type: "string" },
          },
          required: ["tone", "assessment"],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are a trading performance coach giving a first-pass overall " +
      "grade suggestion for a period, based only on the given stats/" +
      "patterns/mistakes/violations — never invent facts not implied by " +
      "the numbers. Return a tone (strong/neutral/weak) and a 1-2 sentence " +
      "assessment. This is only a SUGGESTION the trader can override with " +
      "their own self-assessment.",
    messages: [{ role: "user", content: formatInput(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as {
      tone?: "strong" | "neutral" | "weak";
      assessment?: string;
    };
    if (!parsed.tone || typeof parsed.assessment !== "string") return null;
    return { tone: parsed.tone, assessment: parsed.assessment };
  } catch {
    return null;
  }
}

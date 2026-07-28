import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";

export interface RuleViolationSuggestion {
  label: string;
  reason: string;
}

export async function suggestRuleViolations(
  dayText: string,
  activeRuleLabels: string[],
): Promise<RuleViolationSuggestion[] | null> {
  if (activeRuleLabels.length === 0) return [];

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
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string", enum: activeRuleLabels },
                  reason: { type: "string" },
                },
                required: ["label", "reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are reviewing a futures trader's day against their own rule " +
      "checklist. Only flag a rule if the day's writeup, trades, or notes " +
      "give clear evidence it was broken. Do not guess — an empty list is a " +
      "valid and often correct answer.",
    messages: [
      {
        role: "user",
        content:
          `Rule checklist:\n${activeRuleLabels.map((l) => `- ${l}`).join("\n")}\n\n` +
          `Trading day:\n\n${dayText}\n\n` +
          "Which rules, if any, were broken today? Cite evidence in your reason.",
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as {
      suggestions: RuleViolationSuggestion[];
    };
    return parsed.suggestions;
  } catch {
    return null;
  }
}

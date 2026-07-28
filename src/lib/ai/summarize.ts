import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import { formatTradingDayForAI } from "@/lib/ai/format-day";
import { getTradingDayDetail } from "@/lib/data/trading-day";

export async function summarizeTradingDay(
  day: NonNullable<Awaited<ReturnType<typeof getTradingDayDetail>>>,
): Promise<string | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const dayText = formatTradingDayForAI(day);

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    output_config: { effort: "medium" },
    system:
      "You are a trading journal assistant for a futures trader who uses ICT " +
      "(Inner Circle Trader) concepts, centered on the Unicorn Model. Summarize " +
      "the trader's day in 3-5 concise sentences: what happened, whether they " +
      "followed their plan, and one concrete takeaway. Be direct, no fluff, no " +
      "generic encouragement.",
    messages: [
      {
        role: "user",
        content: `Summarize this trading day:\n\n${dayText}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : null;
}

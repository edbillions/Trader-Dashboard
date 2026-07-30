import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import type { PeriodStats, TiltmeterResult } from "@/lib/domain/period-review";

export async function generatePeriodReviewSummary(input: {
  periodLabel: string;
  stats: PeriodStats;
  tiltmeter: TiltmeterResult;
}): Promise<string | null> {
  const client = await getAnthropicClient();
  if (!client) return null;
  if (input.stats.tradeCount === 0) return null;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    system:
      "You are a trading performance coach writing a short draft summary " +
      "paragraph (3-5 sentences, plain prose, no markdown, no headers) for " +
      "a trader's periodic review. Base it only on the numeric stats given " +
      "— be specific and concrete, not generic filler. This is a DRAFT the " +
      "trader will read and edit themselves, so stay grounded in the " +
      "numbers rather than speculating about causes you can't see.",
    messages: [
      {
        role: "user",
        content:
          `Period: ${input.periodLabel}\n` +
          `Trades: ${input.stats.tradeCount} (${input.stats.winners}W / ${input.stats.losers}L, ` +
          `${input.stats.winRate != null ? input.stats.winRate.toFixed(0) : "—"}% win rate)\n` +
          `Net P&L: $${input.stats.netPnl.toFixed(2)}\n` +
          `Net R: ${input.stats.netR.toFixed(2)}R\n` +
          `Tilt signals: ${input.tiltmeter.signalCount} across ${input.tiltmeter.daysWithTrades} trading day(s)`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;
  return textBlock.text.trim();
}

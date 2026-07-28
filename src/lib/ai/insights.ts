import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import { prisma } from "@/lib/prisma";

export async function getPatternInsights(): Promise<string | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const trades = await prisma.trade.findMany({
    orderBy: { entryTime: "desc" },
    take: 100,
    include: { confluenceFactors: true, mistakes: true },
  });

  if (trades.length < 5) {
    return "Not enough trades logged yet for meaningful pattern analysis.";
  }

  const tradeLines = trades.map(
    (t) =>
      `${t.entryTime.toISOString().slice(0, 10)} ${t.symbol} ${t.direction} ` +
      `netPnl=${t.netPnl ?? "—"} R=${t.rMultiple ?? "—"} model=${t.entryModel ?? "—"} ` +
      `session=${t.session ?? "—"} grade=${t.setupGrade ?? "—"} ` +
      `confluences=[${t.confluenceFactors.map((c) => c.label).join("|")}] ` +
      `mistakes=[${t.mistakes.map((m) => m.label).join("|")}]`,
  );

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    output_config: { effort: "medium" },
    system:
      "You are a trading performance analyst for a futures trader using ICT " +
      "concepts. Given a list of recent trades, surface 2-4 concrete, specific " +
      "patterns — e.g. a session, entry model, or confluence combination that " +
      "correlates with wins or losses. Cite approximate numbers. Skip anything " +
      "you can't support from the data. No generic advice.",
    messages: [
      {
        role: "user",
        content: `Recent trades (most recent first):\n\n${tradeLines.join("\n")}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : null;
}

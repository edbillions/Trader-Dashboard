import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import { prisma } from "@/lib/prisma";

export async function getMistakeCoaching(): Promise<string | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const trades = await prisma.trade.findMany({
    where: { mistakes: { some: {} } },
    orderBy: { entryTime: "desc" },
    take: 60,
    include: { mistakes: true },
  });

  if (trades.length < 3) {
    return "Not enough mistake-tagged trades yet for meaningful coaching. Keep tagging mistakes as you journal trades.";
  }

  const tradeLines = trades.map(
    (t) =>
      `${t.entryTime.toISOString().slice(0, 10)} ${t.symbol} ${t.direction} ` +
      `netPnl=${t.netPnl ?? "—"} R=${t.rMultiple ?? "—"} ` +
      `mistakes=[${t.mistakes.map((m) => m.label).join("|")}] ` +
      `writeup="${(t.writeup ?? "").slice(0, 250)}"`,
  );

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    output_config: { effort: "medium" },
    system:
      "You are a blunt, supportive performance coach for a futures trader. " +
      "Given a list of trades tagged with specific execution mistakes, " +
      "identify the 2-3 most costly or recurring mistakes and give concrete, " +
      "specific advice on how to eliminate each one — not generic " +
      "platitudes. Reference actual numbers/frequency from the data. Keep it " +
      "tight and actionable.",
    messages: [
      {
        role: "user",
        content: `Trades with mistakes tagged (most recent first):\n\n${tradeLines.join("\n")}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : null;
}

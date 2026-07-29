import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import { prisma } from "@/lib/prisma";

export interface TendencyMatch {
  id: string;
  title: string;
  evidence: string;
}

export interface TendencyCandidate {
  title: string;
  description: string;
  evidence: string;
}

export interface TendencyScanResult {
  matches: TendencyMatch[];
  candidates: TendencyCandidate[];
}

export async function scanTendencies(): Promise<TendencyScanResult | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const [tendencies, trades] = await Promise.all([
    prisma.tendency.findMany({ where: { status: { not: "eliminated" } } }),
    prisma.trade.findMany({
      orderBy: { entryTime: "desc" },
      take: 60,
      include: { mistakes: true },
    }),
  ]);

  if (trades.length < 5) {
    return { matches: [], candidates: [] };
  }

  const tradeLines = trades.map(
    (t) =>
      `${t.entryTime.toISOString().slice(0, 10)} ${t.symbol} ${t.direction} ` +
      `netPnl=${t.netPnl ?? "—"} R=${t.rMultiple ?? "—"} grade=${t.setupGrade ?? "—"} ` +
      `mistakes=[${t.mistakes.map((m) => m.label).join("|")}] ` +
      `writeup="${(t.writeup ?? "").slice(0, 300)}"`,
  );

  const tendencyLines = tendencies.map(
    (t) => `- [id:${t.id}] ${t.title}: ${t.description ?? ""}`,
  );

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
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  evidence: { type: "string" },
                },
                required: ["id", "evidence"],
                additionalProperties: false,
              },
            },
            candidates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  evidence: { type: "string" },
                },
                required: ["title", "description", "evidence"],
                additionalProperties: false,
              },
            },
          },
          required: ["matches", "candidates"],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are a performance coach reviewing a futures trader's recent trades " +
      "for recurring BEHAVIORAL TENDENCIES — patterns in how the trader " +
      "behaves across trades and months (e.g. sizing up after a loss, " +
      "overriding a stop, chasing after missing an entry, hesitating on A+ " +
      "setups). This is distinct from one-off execution mistakes on a single " +
      "trade, and distinct from setups the trader intentionally hunts for. " +
      "Cross-check the recent trades against the trader's existing tendency " +
      "list — only cite an existing tendency's id if you see clear repeated " +
      "evidence of it in these trades. Separately, if you notice a distinct " +
      "recurring behavioral tendency that is NOT already in the list, propose " +
      "it as a new candidate with a short title and description. Do not " +
      "invent matches or candidates without clear evidence — empty lists are " +
      "a valid and often correct answer.",
    messages: [
      {
        role: "user",
        content:
          `Existing tendency list:\n${tendencyLines.length ? tendencyLines.join("\n") : "(none yet)"}\n\n` +
          `Recent trades (most recent first):\n\n${tradeLines.join("\n")}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as {
      matches: { id: string; evidence: string }[];
      candidates: TendencyCandidate[];
    };
    const idToTitle = new Map(tendencies.map((t) => [t.id, t.title]));
    return {
      matches: parsed.matches
        .filter((m) => idToTitle.has(m.id))
        .map((m) => ({
          id: m.id,
          title: idToTitle.get(m.id)!,
          evidence: m.evidence,
        })),
      candidates: parsed.candidates,
    };
  } catch {
    return null;
  }
}

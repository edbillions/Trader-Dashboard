import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import type {
  EconomicCalendarEvent,
  WeekAheadDay,
} from "@/lib/types/macro-briefing";

export interface MacroBriefingResult {
  asOf: string | null;
  macroTone: string;
  economicCalendarToday: EconomicCalendarEvent[];
  weekAhead: WeekAheadDay[];
}

export async function generateMacroBriefing(): Promise<MacroBriefingResult | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 6,
      },
    ],
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            asOf: { type: "string" },
            macroTone: { type: "string" },
            economicCalendarToday: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  event: { type: "string" },
                  prior: { type: "string" },
                  estimate: { type: "string" },
                  importance: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                  },
                },
                required: ["time", "event", "importance"],
                additionalProperties: false,
              },
            },
            weekAhead: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  bullets: { type: "array", items: { type: "string" } },
                },
                required: ["date", "bullets"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "asOf",
            "macroTone",
            "economicCalendarToday",
            "weekAhead",
          ],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are a macro markets briefer for a US index-futures (ES/NQ) day " +
      `trader. Today is ${today}. Use web search to find: (1) the current ` +
      "overnight/pre-market tone for US equity index futures — recent price " +
      "action, key overnight headlines, and the dominant macro catalyst; " +
      "(2) today's US economic calendar, including the event name, release " +
      "time (Eastern), prior value, and consensus estimate when available; " +
      "(3) the rest of this week's notable scheduled events (economic data, " +
      "Fed speakers, major earnings). Mark an event's importance as 'high' " +
      "only for major market-moving releases in the ForexFactory 'red " +
      "folder' sense (e.g. CPI, PCE, NFP/jobs report, FOMC decisions, GDP, " +
      "ISM manufacturing/services, retail sales, JOLTS) — everything else is " +
      "'medium' or 'low'. Write macroTone as 1-2 tight paragraphs in a " +
      "terse trading-desk tone, no headers or markdown. If a field truly " +
      "isn't available, use an empty string or empty array rather than " +
      "guessing.",
    messages: [
      {
        role: "user",
        content:
          "Give me today's macro tone briefing and economic calendar for US index futures.",
      },
    ],
  });

  const textBlocks = response.content.filter((b) => b.type === "text");
  const lastText = textBlocks[textBlocks.length - 1];
  if (!lastText || lastText.type !== "text") return null;

  try {
    const parsed = JSON.parse(lastText.text) as {
      asOf: string;
      macroTone: string;
      economicCalendarToday: EconomicCalendarEvent[];
      weekAhead: WeekAheadDay[];
    };
    if (!parsed.macroTone) return null;
    return {
      asOf: parsed.asOf || null,
      macroTone: parsed.macroTone,
      economicCalendarToday: parsed.economicCalendarToday ?? [],
      weekAhead: parsed.weekAhead ?? [],
    };
  } catch {
    return null;
  }
}

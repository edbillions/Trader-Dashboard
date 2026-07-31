import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import type {
  EconomicCalendarEvent,
  WeekAheadDay,
  TrumpAppearance,
} from "@/lib/types/macro-briefing";

export interface MacroBriefingResult {
  asOf: string | null;
  macroTone: string;
  economicCalendarToday: EconomicCalendarEvent[];
  weekAhead: WeekAheadDay[];
  trumpAppearancesToday: TrumpAppearance[];
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
        max_uses: 10,
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
            trumpAppearancesToday: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  description: { type: "string" },
                  marketRelevance: { type: "string" },
                },
                required: ["time", "description", "marketRelevance"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "asOf",
            "macroTone",
            "economicCalendarToday",
            "weekAhead",
            "trumpAppearancesToday",
          ],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are a macro markets briefer for a US index-futures (ES/NQ) day " +
      `trader. Today is ${today}. You have up to 10 web searches — spend ` +
      "them across four required research tasks below. Do not skip a task " +
      "because earlier ones used most of your budget; each one gets at " +
      "least one dedicated search.\n\n" +
      "(1) The current overnight/pre-market tone for US equity index " +
      "futures — recent price action, key overnight headlines, and the " +
      "dominant macro catalyst.\n" +
      "(2) Today's US economic calendar, including the event name, release " +
      "time (Eastern), prior value, and consensus estimate when available.\n" +
      "(3) The rest of this week's notable scheduled events (economic " +
      "data, Fed speakers, major earnings).\n" +
      "(4) Trump watch — this is its own required search task, not an " +
      "afterthought of task (1)'s news search. Run at least one search " +
      "specifically for President Trump's schedule today (queries like " +
      "\"Trump schedule today\", \"White House press pool schedule " +
      `${today}", or "Trump public events today" tend to surface it) ` +
      "before concluding nothing is scheduled. Look for speeches, press " +
      "conferences, Oval Office remarks, rallies, TV/radio interviews, or " +
      "other confirmed public events where he's expected to speak on " +
      "camera or on record — he's known to move markets (tariffs, Fed " +
      "commentary, geopolitics) in real time when he speaks, so traders " +
      "want the heads-up even for a routine-sounding appearance. Only " +
      "include an appearance you can actually confirm via search, with a " +
      "real scheduled time if one is reported (use 'time TBD' if the " +
      "event is confirmed but the exact time isn't) — never invent or " +
      "infer one just because it seems plausible. Only return an empty " +
      "array after that dedicated search has genuinely turned up nothing " +
      "confirmed for today. Also fold any notable Trump appearances later " +
      "in the week into the relevant weekAhead day's bullets.\n\n" +
      "Mark an economic event's importance as 'high' only for major " +
      "market-moving releases in the ForexFactory 'red folder' sense " +
      "(e.g. CPI, PCE, NFP/jobs report, FOMC decisions, GDP, ISM " +
      "manufacturing/services, retail sales, JOLTS) — everything else is " +
      "'medium' or 'low'. Write macroTone as 1-2 tight paragraphs in a " +
      "terse trading-desk tone, no headers or markdown. If a field truly " +
      "isn't available after a real search attempt, use an empty string " +
      "or empty array rather than guessing.",
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
      trumpAppearancesToday: TrumpAppearance[];
    };
    if (!parsed.macroTone) return null;
    return {
      asOf: parsed.asOf || null,
      macroTone: parsed.macroTone,
      economicCalendarToday: parsed.economicCalendarToday ?? [],
      weekAhead: parsed.weekAhead ?? [],
      trumpAppearancesToday: parsed.trumpAppearancesToday ?? [],
    };
  } catch {
    return null;
  }
}

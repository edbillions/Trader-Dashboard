import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import { formatR } from "@/lib/pnl";

export interface TradeSmartReviewInput {
  symbol: string;
  direction: string;
  date: Date;
  entryPrice: number;
  exitPrice: number | null;
  netPnl: number | null;
  rMultiple: number | null;
  setupGrade: string | null;
  entryModel: string | null;
  session: string | null;
  dailyBias: string | null;
  htfPoi: string | null;
  htfDol: string | null;
  stopLossPlanned: number | null;
  stopLossActual: number | null;
  targetPlanned: number | null;
  targetActual: number | null;
  mfeR: number | null;
  maeR: number | null;
  confluenceFactors: { label: string }[];
  mistakes: { label: string }[];
  tags: { label: string }[];
  writeup: string | null;
}

export interface TradeSmartReview {
  summary: string;
  setup: string;
  execution: string;
  psychology: string;
}

// Shared shape between getTradeDetail's and getTradingDayDetail's trade
// records — both include confluenceFactors/mistakes/tags but differ on how
// the trading day's date is reached, so callers pass it separately.
interface TradeRecordForReview {
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  netPnl: number | null;
  rMultiple: number | null;
  setupGrade: string | null;
  entryModel: string | null;
  session: string | null;
  dailyBias: string | null;
  htfPoi: string | null;
  htfDol: string | null;
  stopLossPlanned: number | null;
  stopLossActual: number | null;
  targetPlanned: number | null;
  targetActual: number | null;
  mfeR: number | null;
  maeR: number | null;
  confluenceFactors: { label: string }[];
  mistakes: { label: string }[];
  tags: { label: string }[];
  writeup: string | null;
}

export function buildTradeSmartReviewInput(
  trade: TradeRecordForReview,
  date: Date,
): TradeSmartReviewInput {
  return {
    symbol: trade.symbol,
    direction: trade.direction,
    date,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    netPnl: trade.netPnl,
    rMultiple: trade.rMultiple,
    setupGrade: trade.setupGrade,
    entryModel: trade.entryModel,
    session: trade.session,
    dailyBias: trade.dailyBias,
    htfPoi: trade.htfPoi,
    htfDol: trade.htfDol,
    stopLossPlanned: trade.stopLossPlanned,
    stopLossActual: trade.stopLossActual,
    targetPlanned: trade.targetPlanned,
    targetActual: trade.targetActual,
    mfeR: trade.mfeR,
    maeR: trade.maeR,
    confluenceFactors: trade.confluenceFactors,
    mistakes: trade.mistakes,
    tags: trade.tags,
    writeup: trade.writeup,
  };
}

function formatTradeForAI(trade: TradeSmartReviewInput): string {
  const lines: string[] = [];

  lines.push(`Symbol: ${trade.symbol}`);
  lines.push(`Direction: ${trade.direction}`);
  lines.push(`Date: ${trade.date.toISOString().slice(0, 10)}`);
  lines.push(`Entry price: ${trade.entryPrice}`);
  lines.push(`Exit price: ${trade.exitPrice ?? "—"}`);
  lines.push(`Net P&L: ${trade.netPnl ?? "—"}`);
  lines.push(`R-multiple: ${trade.rMultiple != null ? formatR(trade.rMultiple) : "—"}`);
  lines.push(`Setup grade: ${trade.setupGrade ?? "—"}`);
  lines.push(`Entry model: ${trade.entryModel ?? "—"}`);
  lines.push(`Session: ${trade.session ?? "—"}`);
  lines.push(`Daily bias: ${trade.dailyBias ?? "—"}`);
  lines.push(`HTF POI: ${trade.htfPoi ?? "—"}`);
  lines.push(`HTF DOL: ${trade.htfDol ?? "—"}`);
  lines.push(`Stop (planned): ${trade.stopLossPlanned ?? "—"}`);
  lines.push(`Stop (actual): ${trade.stopLossActual ?? "—"}`);
  lines.push(`Target (planned): ${trade.targetPlanned ?? "—"}`);
  lines.push(`Target (actual): ${trade.targetActual ?? "—"}`);
  lines.push(
    `Max favorable excursion: ${trade.mfeR != null ? formatR(trade.mfeR) : "—"}`,
  );
  lines.push(
    `Max adverse excursion: ${trade.maeR != null ? `${trade.maeR.toFixed(2)}R` : "—"}`,
  );
  lines.push(
    `Confluence factors: [${trade.confluenceFactors.map((c) => c.label).join(", ") || "none"}]`,
  );
  lines.push(`Mistakes: [${trade.mistakes.map((m) => m.label).join(", ") || "none"}]`);
  lines.push(`Tags: [${trade.tags.map((t) => t.label).join(", ") || "none"}]`);
  lines.push(`Writeup: ${trade.writeup ?? "—"}`);

  return lines.join("\n");
}

export async function generateTradeSmartReview(
  trade: TradeSmartReviewInput,
): Promise<TradeSmartReview | null> {
  const client = await getAnthropicClient();
  if (!client) return null;

  const tradeText = formatTradeForAI(trade);

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 768,
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            setup: { type: "string" },
            execution: { type: "string" },
            psychology: { type: "string" },
          },
          required: ["summary", "setup", "execution", "psychology"],
          additionalProperties: false,
        },
      },
    },
    system:
      "You are a trading journal assistant. Write four short 1-2 sentence " +
      "cards from the given trade data only — never invent detail that " +
      "isn't there. For 'summary': state symbol, direction, date, outcome, " +
      "R-multiple, and P&L plainly. For 'setup': assess whether the " +
      "confluence factors and daily bias/POI/DOL fields show a clearly " +
      "confirmed setup, or say plainly that confirmations weren't " +
      "specified if those fields are empty. For 'execution': assess " +
      "execution quality from entry/exit prices, MFE/MAE, and the writeup " +
      "— say execution detail wasn't specified if the writeup is empty. " +
      "For 'psychology': only comment on emotional/psychological state if " +
      "the writeup or tags actually mention it — otherwise say plainly " +
      "that no specific psychology pattern was stated, don't guess.",
    messages: [{ role: "user", content: tradeText }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text) as Partial<TradeSmartReview>;
    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.setup !== "string" ||
      typeof parsed.execution !== "string" ||
      typeof parsed.psychology !== "string"
    ) {
      return null;
    }
    return {
      summary: parsed.summary,
      setup: parsed.setup,
      execution: parsed.execution,
      psychology: parsed.psychology,
    };
  } catch {
    return null;
  }
}

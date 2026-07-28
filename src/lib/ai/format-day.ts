import type { getTradingDayDetail } from "@/lib/data/trading-day";

type TradingDayDetail = NonNullable<
  Awaited<ReturnType<typeof getTradingDayDetail>>
>;

export function formatTradingDayForAI(day: TradingDayDetail): string {
  const lines: string[] = [];

  lines.push(`Date: ${day.date.toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push("## Pre-market plan");
  lines.push(`HTF bias: ${day.htfBias ?? "—"}`);
  lines.push(`Key levels: ${day.keyLevels ?? "—"}`);
  lines.push(`Session timing: ${day.sessionTiming ?? "—"}`);
  lines.push(`News: ${day.news ?? "—"}`);
  lines.push(`Max loss plan: ${day.maxLossPlan ?? "—"}`);
  lines.push(`Position size plan: ${day.positionSizePlan ?? "—"}`);
  lines.push(`Max trade count: ${day.maxTradeCountPlan ?? "—"}`);

  lines.push("");
  lines.push("## Trades");
  if (day.trades.length === 0) {
    lines.push("None.");
  }
  for (const t of day.trades) {
    lines.push(
      `- ${t.symbol} ${t.direction}, entry ${t.entryPrice} exit ${t.exitPrice ?? "open"}, ` +
        `net P&L ${t.netPnl ?? "—"}, R ${t.rMultiple ?? "—"}, model ${t.entryModel ?? "—"}, ` +
        `session ${t.session ?? "—"}, grade ${t.setupGrade ?? "—"}, ` +
        `confluences [${t.confluenceFactors.map((c) => c.label).join(", ")}], ` +
        `mistakes [${t.mistakes.map((m) => m.label).join(", ")}]. Writeup: ${t.writeup ?? "—"}`,
    );
  }

  lines.push("");
  lines.push("## Missed trades");
  if (day.missedTrades.length === 0) {
    lines.push("None.");
  }
  for (const m of day.missedTrades) {
    lines.push(
      `- ${m.symbol}: ${m.setupDescription ?? "—"}. Reason missed: ${m.reasonMissed ?? "—"}`,
    );
  }

  lines.push("");
  lines.push("## Post-session review");
  lines.push(`Plan adherence grade: ${day.planAdherenceGrade ?? "—"}`);
  lines.push(`Psychology log: ${day.psychologyLog ?? "—"}`);
  lines.push(`Notes: ${day.freeformNotes ?? "—"}`);
  lines.push(
    `Rule violations flagged: ${day.ruleViolations.map((r) => r.label).join(", ") || "none"}`,
  );

  return lines.join("\n");
}

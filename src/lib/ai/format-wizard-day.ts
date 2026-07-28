import type { SaveTradingDayInput } from "@/lib/types/journal";
import type { WizardLookups } from "@/lib/data/lookups";

function labelsFor(ids: string[], all: { id: string; label: string }[]) {
  const map = new Map(all.map((o) => [o.id, o.label]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

export function formatWizardDayForAI(
  data: SaveTradingDayInput,
  lookups: WizardLookups,
): string {
  const lines: string[] = [];

  lines.push(`Date: ${data.date}`);
  lines.push("");
  lines.push("## Pre-market plan");
  lines.push(`HTF bias: ${data.htfBias || "—"}`);
  lines.push(`Key levels: ${data.keyLevels || "—"}`);
  lines.push(`Session timing: ${data.sessionTiming || "—"}`);
  lines.push(`News: ${data.news || "—"}`);
  lines.push(`Max loss plan: ${data.maxLossPlan ?? "—"}`);
  lines.push(`Position size plan: ${data.positionSizePlan || "—"}`);
  lines.push(`Max trade count: ${data.maxTradeCountPlan ?? "—"}`);

  lines.push("");
  lines.push("## Trades");
  if (data.trades.length === 0) lines.push("None.");
  for (const t of data.trades) {
    lines.push(
      `- ${t.symbol || "?"} ${t.direction}, entry ${t.entryPrice} exit ${t.exitPrice ?? "open"}, ` +
        `model ${t.entryModel || "—"}, session ${t.session || "—"}, grade ${t.setupGrade || "—"}, ` +
        `confluences [${labelsFor(t.confluenceFactorIds, lookups.confluenceFactors).join(", ")}], ` +
        `mistakes [${labelsFor(t.mistakeIds, lookups.mistakeTypes).join(", ")}]. Writeup: ${t.writeup || "—"}`,
    );
  }

  lines.push("");
  lines.push("## Missed trades");
  if (data.missedTrades.length === 0) lines.push("None.");
  for (const m of data.missedTrades) {
    lines.push(`- ${m.symbol || "?"}: ${m.setupDescription || "—"}. Reason missed: ${m.reasonMissed || "—"}`);
  }

  lines.push("");
  lines.push("## Post-session review");
  lines.push(`Plan adherence grade: ${data.planAdherenceGrade || "—"}`);
  lines.push(`Psychology log: ${data.psychologyLog || "—"}`);
  lines.push(`Notes: ${data.freeformNotes || "—"}`);

  return lines.join("\n");
}

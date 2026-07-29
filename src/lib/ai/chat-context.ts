import { getAnalyticsData } from "@/lib/data/analytics";
import { getDashboardData } from "@/lib/data/dashboard";
import { listLifeGoals, goalProgress } from "@/lib/data/goals-tracker";

export async function buildChatContext(): Promise<string> {
  const [analytics, dashboard, lifeGoals] = await Promise.all([
    getAnalyticsData(),
    getDashboardData(),
    listLifeGoals(),
  ]);

  const lines: string[] = [];
  lines.push(`Total trades logged: ${analytics.totals.tradeCount}`);
  lines.push(`All-time net P&L: ${dashboard.netPnl}`);
  lines.push(
    `Win rate: ${analytics.totals.winRate?.toFixed(1) ?? "—"}%, ` +
      `profit factor: ${analytics.totals.profitFactor?.toFixed(2) ?? "—"}, ` +
      `discipline score: ${analytics.totals.disciplineScore?.toFixed(0) ?? "—"}`,
  );
  lines.push("");
  lines.push("Top entry models by net P&L:");
  for (const s of analytics.breakdowns.byEntryModel.slice(0, 5)) {
    lines.push(`- ${s.label}: ${s.count} trades, net ${s.netPnl.toFixed(0)}`);
  }
  lines.push("");
  lines.push("Top sessions by net P&L:");
  for (const s of analytics.breakdowns.bySession.slice(0, 5)) {
    lines.push(`- ${s.label}: ${s.count} trades, net ${s.netPnl.toFixed(0)}`);
  }
  lines.push("");
  lines.push("Recent days:");
  for (const d of dashboard.recentDays.slice(0, 7)) {
    lines.push(`- ${d.date}: ${d.tradeCount} trades, net ${d.netPnl.toFixed(0)}`);
  }

  if (lifeGoals.length > 0) {
    lines.push("");
    lines.push("Business & personal goals:");
    for (const g of lifeGoals) {
      const progress = goalProgress(g);
      const progressStr =
        progress != null ? `${progress.toFixed(0)}% of target` : "no target set";
      const valueStr =
        g.targetValue != null
          ? `${g.currentValue}${g.unit ?? ""} / ${g.targetValue}${g.unit ?? ""}`
          : `${g.currentValue}${g.unit ?? ""}`;
      lines.push(
        `- [${g.category}${g.isPrimary ? ", MAIN FOCUS" : ""}] ${g.title}: ` +
          `${valueStr} (${progressStr})${g.achieved ? " — ACHIEVED" : ""}` +
          `${g.targetDate ? `, target date ${g.targetDate.toISOString().slice(0, 10)}` : ""}`,
      );
    }
  }

  return lines.join("\n");
}

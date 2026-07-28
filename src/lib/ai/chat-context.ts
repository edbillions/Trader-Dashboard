import { getAnalyticsData } from "@/lib/data/analytics";
import { getDashboardData } from "@/lib/data/dashboard";

export async function buildChatContext(): Promise<string> {
  const [analytics, dashboard] = await Promise.all([
    getAnalyticsData(),
    getDashboardData(),
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

  return lines.join("\n");
}

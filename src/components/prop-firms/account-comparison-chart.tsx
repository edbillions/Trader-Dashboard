"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/pnl";

interface AccountStat {
  label: string;
  netPnl: number;
  tradeCount: number;
  winRate: number | null;
}

export function AccountComparisonChart({ stats }: { stats: AccountStat[] }) {
  const data = [...stats]
    .sort((a, b) => b.netPnl - a.netPnl)
    .map((s) => ({
      label: s.label,
      netPnl: Math.round(s.netPnl),
      tradeCount: s.tradeCount,
      winRate: s.winRate,
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-raised)" }}
          contentStyle={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--foreground)",
            fontSize: 12,
          }}
          formatter={(value, _name, item) => {
            const payload = item.payload as (typeof data)[number];
            return [
              `${formatCurrency(Number(value))} · ${payload.tradeCount} trades · ${
                payload.winRate != null ? payload.winRate.toFixed(0) : "—"
              }% win`,
              "Net P&L",
            ];
          }}
        />
        <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.label}
              fill={d.netPnl >= 0 ? "var(--profit)" : "var(--loss)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

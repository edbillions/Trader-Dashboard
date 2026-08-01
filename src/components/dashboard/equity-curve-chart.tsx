"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/pnl";

export function EquityCurveChart({
  data,
  height = 260,
  variant = "default",
}: {
  data: { date: string; equity: number }[];
  height?: number;
  // "minimal" drops gridlines/axes for a cleaner, more visual presentation
  // — used on the Dashboard's featured equity curve card. "default" keeps
  // the fully-labeled chart used elsewhere (Trades page, day performance
  // card).
  variant?: "default" | "minimal";
}) {
  const last = data[data.length - 1]?.equity ?? 0;
  const color = last >= 0 ? "var(--profit)" : "var(--loss)";
  const minimal = variant === "minimal";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={
          minimal
            ? { top: 8, right: 8, left: 8, bottom: 0 }
            : { top: 8, right: 8, left: 8, bottom: 8 }
        }
      >
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={minimal ? 0.45 : 0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {!minimal && (
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        )}
        <XAxis
          dataKey="date"
          tick={minimal ? false : { fill: "var(--muted)", fontSize: 11 }}
          axisLine={minimal ? false : { stroke: "var(--border)" }}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis
          tick={minimal ? false : { fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={minimal ? 0 : 70}
          tickFormatter={(v) => formatCurrency(Number(v))}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          contentStyle={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--foreground)",
            fontSize: 12,
          }}
          formatter={(value) => formatCurrency(Number(value))}
        />
        <Area
          type="monotone"
          dataKey="equity"
          stroke={color}
          strokeWidth={minimal ? 2.5 : 2}
          fill="url(#equityFill)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

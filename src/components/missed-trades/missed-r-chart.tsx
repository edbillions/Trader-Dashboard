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
import { formatR } from "@/lib/pnl";

export function MissedRChart({
  data,
}: {
  data: { date: string; cumulativeR: number }[];
}) {
  const last = data[data.length - 1]?.cumulativeR ?? 0;
  const color = last >= 0 ? "var(--profit)" : "var(--loss)";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="missedRFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
          tickFormatter={(v) => `${v}R`}
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
          formatter={(value) => formatR(Number(value))}
        />
        <Area
          type="monotone"
          dataKey="cumulativeR"
          stroke={color}
          strokeWidth={2}
          fill="url(#missedRFill)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

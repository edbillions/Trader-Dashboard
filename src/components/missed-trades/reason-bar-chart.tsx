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
import { formatR } from "@/lib/pnl";

export function ReasonBarChart({
  stats,
}: {
  stats: { label: string; totalR: number }[];
}) {
  const data = stats.map((s) => ({
    label: s.label,
    totalR: Math.round(s.totalR * 100) / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
          formatter={(value) => formatR(Number(value))}
        />
        <Bar dataKey="totalR" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.label}
              fill={d.totalR >= 0 ? "var(--profit)" : "var(--loss)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

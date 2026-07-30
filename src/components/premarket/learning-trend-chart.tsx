"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const INSTRUMENT_COLORS: Record<string, string> = {
  NQ: "var(--accent)",
  ES: "var(--profit)",
};

export function LearningTrendChart({
  data,
  instruments,
}: {
  data: Record<string, string | number>[];
  instruments: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--foreground)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {instruments.map((instrument) => (
          <Line
            key={instrument}
            type="monotone"
            dataKey={instrument}
            name={instrument}
            stroke={INSTRUMENT_COLORS[instrument] ?? "var(--muted)"}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

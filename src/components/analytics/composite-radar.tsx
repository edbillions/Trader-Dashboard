"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function CompositeRadar({
  breakdown,
}: {
  breakdown: {
    winRate: number;
    profitFactor: number;
    avgWinLoss: number;
    discipline: number;
  };
}) {
  const data = [
    { metric: "Win rate", value: Math.round(breakdown.winRate) },
    { metric: "Profit factor", value: Math.round(breakdown.profitFactor) },
    { metric: "Avg win/loss", value: Math.round(breakdown.avgWinLoss) },
    { metric: "Discipline", value: Math.round(breakdown.discipline) },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "var(--muted)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fill: "var(--muted)", fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          dataKey="value"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.35}
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
      </RadarChart>
    </ResponsiveContainer>
  );
}

"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

// Compact, axis-free version of EquityCurveChart for inline use in table
// rows. Series is anchored with a leading 0 (every day genuinely starts at
// $0 P&L before the first trade), so a single trade still draws a real
// two-point line rather than a single dot. A day with zero trades is just
// that lone anchor (length 1) — nothing meaningful to draw, so it's skipped.
export function DaySparkline({
  series,
  width = 90,
  height = 32,
}: {
  series: number[];
  width?: number;
  height?: number;
}) {
  const gradientId = useId();

  if (series.length < 2) return null;

  const data = series.map((equity, i) => ({ i, equity }));
  const last = series[series.length - 1];
  const color = last >= 0 ? "var(--profit)" : "var(--loss)";

  return (
    <div style={{ width, height }} className="shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 1, left: 1, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="equity"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

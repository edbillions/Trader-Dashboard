"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  runMonteCarloSimulation,
  type SimulationSummary,
} from "@/lib/domain/simulator";
import { formatR } from "@/lib/pnl";

const NUM_SIMULATIONS = 500;
const MIN_SAMPLE = 20;
const TRADE_COUNT_OPTIONS = [50, 100, 200];

export function PerformanceSimulator({
  historicalRMultiples,
}: {
  historicalRMultiples: number[];
}) {
  const [numTrades, setNumTrades] = useState(100);
  const [result, setResult] = useState<SimulationSummary | null>(null);

  const hasEnoughData = historicalRMultiples.length >= MIN_SAMPLE;

  // Math.random()-based, so it must only ever run client-side post-mount —
  // running it during the initial render would produce output that differs
  // between the server-rendered HTML and the client's hydration pass.
  useEffect(() => {
    if (!hasEnoughData) return;
    setResult(
      runMonteCarloSimulation(historicalRMultiples, numTrades, NUM_SIMULATIONS),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historicalRMultiples.length, numTrades, hasEnoughData]);

  if (!hasEnoughData) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
        Log at least {MIN_SAMPLE} trades with an R-multiple to unlock the
        performance simulator.
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Running simulation...
      </div>
    );
  }

  const chartData = result.points.map((p) => ({
    step: p.step,
    band: [p.p10, p.p90] as [number, number],
    median: p.median,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {TRADE_COUNT_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNumTrades(n)}
            className={clsx(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              numTrades === n
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            Next {n} trades
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="step"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            label={{ value: "Trades ahead", position: "insideBottom", offset: -4, fill: "var(--muted)", fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={(v) => `${v}R`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--foreground)",
              fontSize: 12,
            }}
            formatter={(value, name) =>
              name === "band"
                ? [`${(value as [number, number])[0]}R to ${(value as [number, number])[1]}R`, "10th-90th pct"]
                : [`${value}R`, "Median"]
            }
          />
          <Area
            type="monotone"
            dataKey="band"
            stroke="none"
            fill="var(--accent)"
            fillOpacity={0.15}
          />
          <Line
            type="monotone"
            dataKey="median"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Median outcome" value={formatR(result.finalMedian)} />
        <Stat label="Worst case (10th pct)" value={formatR(result.finalP10)} />
        <Stat label="Best case (90th pct)" value={formatR(result.finalP90)} />
        <Stat
          label="Probability net positive"
          value={`${result.probNetPositive.toFixed(0)}%`}
        />
      </div>

      <p className="mt-3 text-[11px] text-muted">
        Bootstrap-resampled from your {historicalRMultiples.length}{" "}
        historical R-multiples across {NUM_SIMULATIONS} simulated paths. Not
        a prediction — a range of plausible outcomes if your historical edge
        holds.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

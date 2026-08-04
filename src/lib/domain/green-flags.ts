import type { TiltSignal } from "@/lib/domain/tilt";

// Live Session Daily Recap: the fixed 5-item "Green Flags" checklist.

export interface GreenFlagItem {
  label: string;
  passed: boolean;
}

export interface GreenFlagsInput {
  tiltSignals: TiltSignal[];
  tradesTaken: number;
  maxTradeCountPlan: number | null;
  lossUsedToday: number;
  maxLossPlan: number | null;
  emergencyPauseUsed: boolean;
}

export function computeGreenFlags(input: GreenFlagsInput): GreenFlagItem[] {
  const withinMaxTrades =
    input.maxTradeCountPlan == null || input.tradesTaken <= input.maxTradeCountPlan;
  const lossExposurePct =
    input.maxLossPlan != null && input.maxLossPlan > 0
      ? (input.lossUsedToday / Math.abs(input.maxLossPlan)) * 100
      : null;
  const noMeaningfulLossExposure = lossExposurePct == null || lossExposurePct < 80;
  const noSizeUp = !input.tiltSignals.some((s) => s.type === "size_up_after_loss");

  return [
    {
      label: "Rules held all day — no breaches",
      passed: input.tiltSignals.length === 0,
    },
    {
      label: "Stayed within max trades",
      passed: withinMaxTrades,
    },
    {
      label: "No meaningful daily loss exposure",
      passed: noMeaningfulLossExposure,
    },
    {
      label: "Every loss respected your risk-per-trade limit",
      passed: noSizeUp,
    },
    {
      label: "Never triggered protection mode",
      passed: !input.emergencyPauseUsed,
    },
  ];
}

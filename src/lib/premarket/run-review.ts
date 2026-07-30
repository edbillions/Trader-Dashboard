import { captureChartScreenshots, type CapturedChart } from "@/lib/browser/capture-charts";
import {
  runDailyReviewGrading,
  type Instrument,
  type DailyReviewGrading,
} from "@/lib/ai/premarket-analysis";

export interface MorningAnalysisSummaryInput {
  overallBias: string;
  biasReasoning: string;
  expectedNarrative: string;
  invalidationLevel: string;
  primaryTarget: string;
  secondaryTarget: string;
  tradeable: boolean;
  noTradeReason: string | null;
}

export function formatMorningAnalysisSummary(a: MorningAnalysisSummaryInput): string {
  const lines = [
    `Overall bias: ${a.overallBias}`,
    `Reasoning: ${a.biasReasoning}`,
    `Expected narrative: ${a.expectedNarrative}`,
    `Invalidation level: ${a.invalidationLevel}`,
    `Primary target: ${a.primaryTarget}`,
    `Secondary target: ${a.secondaryTarget}`,
  ];
  if (!a.tradeable) {
    lines.push(`Marked DO NOT TRADE — reason: ${a.noTradeReason ?? "unspecified"}`);
  }
  return lines.join("\n");
}

export interface DailyReviewResult {
  screenshots: CapturedChart[];
  grading: DailyReviewGrading;
}

// Split from capture for the same reason as analyzePreMarketScreenshots —
// lets the Server Action capture all instruments sequentially through one
// shared browser context before grading them (which doesn't touch the browser).
export async function gradeDailyReview(
  instrument: Instrument,
  morningAnalysis: MorningAnalysisSummaryInput,
  screenshots: CapturedChart[],
): Promise<DailyReviewResult | null> {
  const grading = await runDailyReviewGrading(
    instrument,
    formatMorningAnalysisSummary(morningAnalysis),
    screenshots.map((s) => ({ timeframe: s.timeframe, base64: s.base64 })),
  );
  if (!grading) return null;

  return { screenshots, grading };
}

export async function runDailyReviewForInstrument(
  instrument: Instrument,
  morningAnalysis: MorningAnalysisSummaryInput,
): Promise<DailyReviewResult | null> {
  const screenshots = await captureChartScreenshots(instrument, "eod");
  return gradeDailyReview(instrument, morningAnalysis, screenshots);
}

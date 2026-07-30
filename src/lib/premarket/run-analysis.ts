import { captureChartScreenshots, type CapturedChart } from "@/lib/browser/capture-charts";
import {
  runIctRead,
  runDailyBiasSynthesis,
  type Instrument,
  type IctRead,
  type DailyBiasSynthesis,
} from "@/lib/ai/premarket-analysis";
import { normalizeBiasPercentages } from "@/lib/domain/premarket";

export interface PreMarketAnalysisResult {
  screenshots: CapturedChart[];
  ictRead: IctRead;
  synthesis: DailyBiasSynthesis;
}

// Split from capture so a caller processing multiple instruments (e.g. the
// Server Action running both NQ and ES) can capture through one shared
// browser context sequentially, then run the AI analysis stage — which
// doesn't touch the browser — freely in parallel.
export async function analyzePreMarketScreenshots(
  instrument: Instrument,
  screenshots: CapturedChart[],
): Promise<PreMarketAnalysisResult | null> {
  const ictRead = await runIctRead(
    instrument,
    screenshots.map((s) => ({ timeframe: s.timeframe, base64: s.base64 })),
  );
  if (!ictRead) return null;

  const synthesis = await runDailyBiasSynthesis(instrument, ictRead);
  if (!synthesis) return null;

  const normalized = normalizeBiasPercentages(
    synthesis.bullishPct,
    synthesis.bearishPct,
    synthesis.rangePct,
  );

  return {
    screenshots,
    ictRead,
    synthesis: { ...synthesis, ...normalized },
  };
}

// Plain, reusable function (not a Server Action) so the pipeline stays
// testable/importable outside a request context. Launches its own browser
// context — for processing multiple instruments together, capture through a
// shared context and call `analyzePreMarketScreenshots` directly instead.
export async function runPreMarketAnalysisForInstrument(
  instrument: Instrument,
): Promise<PreMarketAnalysisResult | null> {
  const screenshots = await captureChartScreenshots(instrument, "morning");
  return analyzePreMarketScreenshots(instrument, screenshots);
}

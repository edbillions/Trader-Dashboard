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

// Plain, reusable function (not a Server Action) so the pipeline stays
// testable/importable outside a request context.
export async function runPreMarketAnalysisForInstrument(
  instrument: Instrument,
): Promise<PreMarketAnalysisResult | null> {
  const screenshots = await captureChartScreenshots(instrument, "morning");

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

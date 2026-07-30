import { DoNotTradeBanner } from "@/components/premarket/do-not-trade-banner";
import { BiasSplitBar } from "@/components/premarket/bias-split-bar";
import { TradeScenarioCard } from "@/components/premarket/trade-scenario-card";
import { PullIntoJournalButton } from "@/components/premarket/pull-into-journal-button";
import type {
  IctRead,
  TradeScenario,
} from "@/lib/ai/premarket-analysis";

interface ScreenshotRow {
  id: string;
  timeframe: string;
  phase: string;
  filePath: string;
}

interface ReviewRow {
  actualPriceActionSummary: string;
  biasCorrect: boolean;
  biasAccuracyScore: number;
  biasNotes: string;
  liquidityAccuracyScore: number;
  liquidityNotes: string;
  fvgAccuracyScore: number;
  fvgNotes: string;
  targetAccuracyScore: number;
  targetNotes: string;
  narrativeAccuracyScore: number;
  narrativeNotes: string;
  overallAccuracyScore: number;
  overallSummary: string;
}

export interface AnalysisRow {
  id: string;
  instrument: string;
  htfBiasAnalysis: string;
  liquidityAnalysis: string;
  fvgAnalysis: string;
  premiumDiscountZone: string;
  premiumDiscountNotes: string;
  bullishPct: number;
  bearishPct: number;
  rangePct: number;
  overallBias: string;
  biasConfidence: number;
  biasReasoning: string;
  expectedNarrative: string;
  invalidationLevel: string;
  primaryTarget: string;
  secondaryTarget: string;
  tradeable: boolean;
  noTradeReason: string | null;
  tradeScenarios: string;
  screenshots: ScreenshotRow[];
  review: ReviewRow | null;
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value || "—"}</dd>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <ul className="mt-0.5 flex flex-col gap-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InstrumentAnalysisCard({
  analysis,
  showActions,
}: {
  analysis: AnalysisRow;
  showActions: boolean;
}) {
  const htfBias: IctRead["htfBias"] = JSON.parse(analysis.htfBiasAnalysis);
  const liquidity: IctRead["liquidity"] = JSON.parse(analysis.liquidityAnalysis);
  const fvgs: IctRead["fairValueGaps"] = JSON.parse(analysis.fvgAnalysis);
  const scenarios: TradeScenario[] = JSON.parse(analysis.tradeScenarios);

  const morningShots = analysis.screenshots.filter((s) => s.phase === "morning");
  const eodShots = analysis.screenshots.filter((s) => s.phase === "eod");

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{analysis.instrument}</h3>
        <span className="text-xs text-muted">
          Confidence {Math.round(analysis.biasConfidence)}%
        </span>
      </div>

      {!analysis.tradeable ? (
        <DoNotTradeBanner reason={analysis.noTradeReason} />
      ) : (
        <BiasSplitBar
          bullishPct={analysis.bullishPct}
          bearishPct={analysis.bearishPct}
          rangePct={analysis.rangePct}
        />
      )}

      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
        <Info label="Overall bias" value={analysis.overallBias} />
        <Info label="Invalidation level" value={analysis.invalidationLevel} />
        <Info label="Primary target" value={analysis.primaryTarget} />
        <Info label="Secondary target" value={analysis.secondaryTarget} />
        <Info label="Premium/Discount" value={analysis.premiumDiscountZone} />
      </dl>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-1 text-xs font-medium text-muted">Reasoning</p>
        <p className="text-sm text-foreground">{analysis.biasReasoning}</p>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-xs font-medium text-muted">Expected narrative</p>
        <p className="text-sm text-foreground">{analysis.expectedNarrative}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-4 lg:grid-cols-3">
        {scenarios.map((s) => (
          <TradeScenarioCard key={s.scenario} scenario={s} />
        ))}
      </div>

      <details className="mt-4 border-t border-border pt-4">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">
          HTF Bias detail
        </summary>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Info label="Market structure" value={htfBias.marketStructure} />
          <Info label="Order flow" value={htfBias.orderFlow} />
          <Info label="Daily open" value={htfBias.dailyOpen} />
          <Info label="Weekly open" value={htfBias.weeklyOpen} />
          <Info label="Previous day high" value={htfBias.previousDayHigh} />
          <Info label="Previous day low" value={htfBias.previousDayLow} />
          <Info label="Current draw on liquidity" value={htfBias.currentDrawOnLiquidity} />
          <Info label="HTF Fair Value Gaps" value={htfBias.htfFairValueGapsSummary} />
        </dl>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ListBlock label="Swing highs" items={htfBias.swingHighs} />
          <ListBlock label="Swing lows" items={htfBias.swingLows} />
        </div>
      </details>

      <details className="mt-3 border-t border-border pt-4">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">
          Liquidity detail
        </summary>
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="text-xs font-medium text-accent">ERL / IRL narrative</p>
          <p className="mt-1 text-sm text-foreground">{liquidity.erlIrlNarrative}</p>
        </div>
        <p className="mt-3 text-sm text-foreground">
          Expected draw on liquidity: {liquidity.expectedDrawOnLiquidity}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ListBlock label="Buy-side liquidity" items={liquidity.buySideLiquidity} />
          <ListBlock label="Sell-side liquidity" items={liquidity.sellSideLiquidity} />
          <ListBlock label="Equal highs" items={liquidity.equalHighs} />
          <ListBlock label="Equal lows" items={liquidity.equalLows} />
          <ListBlock label="Internal liquidity" items={liquidity.internalLiquidity} />
          <ListBlock label="External liquidity" items={liquidity.externalLiquidity} />
          <ListBlock label="Sweeps" items={liquidity.sweeps} />
          <ListBlock label="Stop hunts" items={liquidity.stopHunts} />
        </div>
      </details>

      <details className="mt-3 border-t border-border pt-4">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">
          Fair Value Gaps
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FvgList label="1 Hour" items={fvgs.oneHour} />
          <FvgList label="15 Minute" items={fvgs.fifteenMinute} />
        </div>
      </details>

      {(morningShots.length > 0 || eodShots.length > 0) && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-muted">Screenshots</p>
          <div className="flex flex-wrap gap-3">
            {[...morningShots, ...eodShots].map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={s.id} href={s.filePath} target="_blank" rel="noreferrer">
                <img
                  src={s.filePath}
                  alt={`${analysis.instrument} ${s.timeframe} (${s.phase})`}
                  title={`${s.timeframe} — ${s.phase}`}
                  className="h-20 w-32 rounded-lg border border-border object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {analysis.review && (
        <div className="mt-4 rounded-lg border border-border bg-surface-raised p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Daily Review</p>
            <span className="text-sm font-semibold text-accent">
              {Math.round(analysis.review.overallAccuracyScore)}/100
            </span>
          </div>
          <p className="mb-3 text-sm text-foreground">{analysis.review.overallSummary}</p>
          <p className="mb-3 text-xs text-muted">
            {analysis.review.actualPriceActionSummary}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <ReviewScore label="Bias" score={analysis.review.biasAccuracyScore} />
            <ReviewScore label="Liquidity" score={analysis.review.liquidityAccuracyScore} />
            <ReviewScore label="FVG" score={analysis.review.fvgAccuracyScore} />
            <ReviewScore label="Target" score={analysis.review.targetAccuracyScore} />
            <ReviewScore label="Narrative" score={analysis.review.narrativeAccuracyScore} />
          </div>
        </div>
      )}

      {showActions && (
        <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
          <PullIntoJournalButton analysisId={analysis.id} />
        </div>
      )}
    </div>
  );
}

function FvgList({
  label,
  items,
}: {
  label: string;
  items: { direction: string; priceRange: string; rank: number; alignsWithHtfBias: boolean; notes: string }[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">None identified.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {[...items]
            .sort((a, b) => a.rank - b.rank)
            .map((fvg, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-surface-raised p-2 text-xs"
              >
                <span
                  className={
                    fvg.direction === "bullish"
                      ? "font-medium text-profit"
                      : "font-medium text-loss"
                  }
                >
                  #{fvg.rank} {fvg.direction}
                </span>{" "}
                <span className="text-foreground">{fvg.priceRange}</span>
                {fvg.alignsWithHtfBias && (
                  <span className="ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
                    aligns w/ HTF
                  </span>
                )}
                <p className="mt-0.5 text-muted">{fvg.notes}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function ReviewScore({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{Math.round(score)}</p>
    </div>
  );
}


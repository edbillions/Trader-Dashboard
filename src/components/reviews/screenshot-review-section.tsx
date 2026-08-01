"use client";

import { useState } from "react";
import { Field, TextArea, Select } from "@/components/ui/field";
import type { FullTrade } from "@/lib/data/reviews";
import type { ScreenshotReviewPicks } from "@/lib/types/review-sections";

function TradeScreenshotPicker({
  label,
  trades,
  tradeFieldName,
  screenshotFieldName,
  defaultTradeId,
  defaultScreenshotId,
}: {
  label: string;
  trades: FullTrade[];
  tradeFieldName: string;
  screenshotFieldName: string;
  defaultTradeId: string | null;
  defaultScreenshotId: string | null;
}) {
  const [tradeId, setTradeId] = useState(defaultTradeId ?? "");
  const selectedTrade = trades.find((t) => t.id === tradeId);

  return (
    <div className="flex flex-col gap-2">
      <Field label={label}>
        <Select
          name={tradeFieldName}
          value={tradeId}
          onChange={(e) => setTradeId(e.target.value)}
        >
          <option value="">— Select a trade —</option>
          {trades.map((t) => (
            <option key={t.id} value={t.id}>
              {t.symbol} · {t.entryTime.toISOString().slice(0, 10)}
            </option>
          ))}
        </Select>
      </Field>
      {selectedTrade && selectedTrade.screenshots.length > 0 && (
        <Field label="Screenshot">
          <Select name={screenshotFieldName} defaultValue={defaultScreenshotId ?? ""}>
            <option value="">— None —</option>
            {selectedTrade.screenshots.map((s, i) => (
              <option key={s.id} value={s.id}>
                Screenshot {i + 1}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  );
}

export function ScreenshotReviewSection({
  trades,
  defaultPicks,
}: {
  trades: FullTrade[];
  defaultPicks: ScreenshotReviewPicks;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Screenshot Review</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TradeScreenshotPicker
          label="Best trade"
          trades={trades}
          tradeFieldName="screenshotReview.bestTradeId"
          screenshotFieldName="screenshotReview.bestTradeScreenshotId"
          defaultTradeId={defaultPicks.bestTradeId}
          defaultScreenshotId={defaultPicks.bestTradeScreenshotId}
        />
        <TradeScreenshotPicker
          label="Worst trade"
          trades={trades}
          tradeFieldName="screenshotReview.worstTradeId"
          screenshotFieldName="screenshotReview.worstTradeScreenshotId"
          defaultTradeId={defaultPicks.worstTradeId}
          defaultScreenshotId={defaultPicks.worstTradeScreenshotId}
        />
        <TradeScreenshotPicker
          label="Biggest mistake"
          trades={trades}
          tradeFieldName="screenshotReview.biggestMistakeTradeId"
          screenshotFieldName="screenshotReview.biggestMistakeScreenshotId"
          defaultTradeId={defaultPicks.biggestMistakeTradeId}
          defaultScreenshotId={defaultPicks.biggestMistakeScreenshotId}
        />
        <Field label="Best missed setup (note)">
          <TextArea
            name="screenshotReview.bestMissedSetupNote"
            defaultValue={defaultPicks.bestMissedSetupNote ?? ""}
            placeholder="No screenshot relation for missed setups yet — describe it here."
          />
        </Field>
      </div>
    </div>
  );
}

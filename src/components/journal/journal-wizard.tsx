"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { WizardLookups } from "@/lib/data/lookups";
import {
  emptyMissedTrade,
  emptyTrade,
  type SaveTradingDayInput,
} from "@/lib/types/journal";
import { saveTradingDayAction, uploadScreenshotAction } from "@/lib/actions/journal";
import { suggestRuleViolationsAction } from "@/lib/actions/ai";
import { Field, TextInput, TextArea, Select } from "@/components/ui/field";
import { TradeCard } from "@/components/journal/trade-card";
import { MissedTradeCard } from "@/components/journal/missed-trade-card";

const STEPS = [
  { key: "plan", label: "Pre-Market Plan" },
  { key: "trades", label: "Trades" },
  { key: "missed", label: "Missed Trades" },
  { key: "review", label: "Post-Session Review" },
] as const;

export function JournalWizard({
  initial,
  lookups,
}: {
  initial: SaveTradingDayInput;
  lookups: WizardLookups;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<SaveTradingDayInput>(initial);
  const [isSaving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSuggesting, startSuggest] = useTransition();
  const [suggestions, setSuggestions] = useState<
    { id: string; label: string; reason: string }[] | null
  >(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [isUploadingPlan, startPlanUpload] = useTransition();
  const router = useRouter();

  const step = STEPS[stepIndex];

  useEffect(() => {
    const raw = sessionStorage.getItem("unicorn-grader-handoff");
    if (!raw) return;
    sessionStorage.removeItem("unicorn-grader-handoff");
    try {
      const handoff = JSON.parse(raw) as {
        entryModel: string;
        setupGrade: string;
        confluenceFactorLabels: string[];
      };
      const labelToId = new Map(
        lookups.confluenceFactors.map((c) => [c.label, c.id]),
      );
      const trade = emptyTrade();
      trade.entryModel = handoff.entryModel;
      trade.setupGrade = handoff.setupGrade;
      trade.confluenceFactorIds = handoff.confluenceFactorLabels
        .map((label) => labelToId.get(label))
        .filter((id): id is string => !!id);
      setData((d) => ({ ...d, trades: [...d.trades, trade] }));
      setStepIndex(1);
    } catch {
      // ignore malformed handoff data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof SaveTradingDayInput>(
    key: K,
    val: SaveTradingDayInput[K],
  ) {
    setData((d) => ({ ...d, [key]: val }));
  }

  function handlePlanFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", "plans");
    startPlanUpload(async () => {
      const result = await uploadScreenshotAction(formData);
      set("planScreenshotPaths", [...data.planScreenshotPaths, result.path]);
    });
    e.target.value = "";
  }

  function handleSuggest() {
    setAiUnavailable(false);
    startSuggest(async () => {
      const result = await suggestRuleViolationsAction(data);
      if (!result.available) {
        setAiUnavailable(true);
        setSuggestions(null);
        return;
      }
      setSuggestions(result.suggestions);
    });
  }

  function handleSave() {
    setError(null);
    startSave(async () => {
      try {
        const result = await saveTradingDayAction(data);
        router.push(`/journal/${result.date}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStepIndex(i)}
            className={clsx(
              "flex-1 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
              i === stepIndex
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            <span className="block text-[10px] uppercase tracking-wide opacity-70">
              Step {i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {step.key === "plan" && (
        <div className="flex flex-col gap-4">
          <Field label="Date">
            <TextInput
              type="date"
              value={data.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="HTF bias">
              <TextInput
                value={data.htfBias}
                onChange={(e) => set("htfBias", e.target.value)}
                placeholder="Bullish above yesterday's high..."
              />
            </Field>
            <Field label="Key levels">
              <TextInput
                value={data.keyLevels}
                onChange={(e) => set("keyLevels", e.target.value)}
                placeholder="PDH 5920, PWL 5875..."
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Session timing & killzones">
              <TextInput
                value={data.sessionTiming}
                onChange={(e) => set("sessionTiming", e.target.value)}
                placeholder="Focused on NY AM silver bullet"
              />
            </Field>
            <Field label="News / economic calendar">
              <TextInput
                value={data.news}
                onChange={(e) => set("news", e.target.value)}
                placeholder="CPI at 8:30am"
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Max loss for the day ($)">
              <TextInput
                type="number"
                step="any"
                value={data.maxLossPlan ?? ""}
                onChange={(e) =>
                  set(
                    "maxLossPlan",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </Field>
            <Field label="Position sizing plan">
              <TextInput
                value={data.positionSizePlan}
                onChange={(e) => set("positionSizePlan", e.target.value)}
                placeholder="2 contracts max"
              />
            </Field>
            <Field label="Max trade count">
              <TextInput
                type="number"
                min={0}
                value={data.maxTradeCountPlan ?? ""}
                onChange={(e) =>
                  set(
                    "maxTradeCountPlan",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">
              Screenshots
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {data.planScreenshotPaths.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p}
                  src={p}
                  alt="Pre-market plan screenshot"
                  className="h-16 w-16 rounded-lg border border-border object-cover"
                />
              ))}
              <label className="cursor-pointer rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted hover:text-foreground">
                {isUploadingPlan ? "Uploading..." : "+ Add screenshot"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePlanFileChange}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {step.key === "trades" && (
        <div className="flex flex-col gap-4">
          {data.trades.map((trade, i) => (
            <TradeCard
              key={i}
              index={i}
              value={trade}
              lookups={lookups}
              onChange={(next) =>
                set(
                  "trades",
                  data.trades.map((t, j) => (j === i ? next : t)),
                )
              }
              onRemove={() =>
                set(
                  "trades",
                  data.trades.filter((_, j) => j !== i),
                )
              }
            />
          ))}
          <button
            type="button"
            onClick={() => set("trades", [...data.trades, emptyTrade()])}
            className="rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted hover:text-foreground"
          >
            + Add trade
          </button>
        </div>
      )}

      {step.key === "missed" && (
        <div className="flex flex-col gap-4">
          {data.missedTrades.map((missed, i) => (
            <MissedTradeCard
              key={i}
              index={i}
              value={missed}
              lookups={lookups}
              onChange={(next) =>
                set(
                  "missedTrades",
                  data.missedTrades.map((m, j) => (j === i ? next : m)),
                )
              }
              onRemove={() =>
                set(
                  "missedTrades",
                  data.missedTrades.filter((_, j) => j !== i),
                )
              }
            />
          ))}
          <button
            type="button"
            onClick={() =>
              set("missedTrades", [...data.missedTrades, emptyMissedTrade()])
            }
            className="rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted hover:text-foreground"
          >
            + Add missed trade
          </button>
        </div>
      )}

      {step.key === "review" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Plan adherence grade">
              <Select
                value={data.planAdherenceGrade}
                onChange={(e) => set("planAdherenceGrade", e.target.value)}
              >
                <option value="">—</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </Select>
            </Field>
          </div>
          <Field label="Psychology / emotional log">
            <TextArea
              value={data.psychologyLog}
              onChange={(e) => set("psychologyLog", e.target.value)}
              placeholder="How did you feel? Discipline, FOMO, confidence..."
            />
          </Field>
          <Field label="Wins / losses / improvements">
            <TextArea
              value={data.freeformNotes}
              onChange={(e) => set("freeformNotes", e.target.value)}
              placeholder="What went well, what to fix tomorrow..."
            />
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">
              Rule violations today
            </span>
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
              {lookups.ruleViolations.map((rule) => (
                <label
                  key={rule.id}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={data.ruleViolationIds.includes(rule.id)}
                    onChange={(e) =>
                      set(
                        "ruleViolationIds",
                        e.target.checked
                          ? [...data.ruleViolationIds, rule.id]
                          : data.ruleViolationIds.filter(
                              (id) => id !== rule.id,
                            ),
                      )
                    }
                  />
                  {rule.label}
                </label>
              ))}
              {lookups.ruleViolations.length === 0 && (
                <span className="text-sm text-muted">
                  No rules configured yet — add some in Settings.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="mt-1 w-fit rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
            >
              {isSuggesting ? "Asking AI..." : "Get AI suggestions"}
            </button>
            {aiUnavailable && (
              <p className="text-xs text-muted">
                AI features aren&apos;t available — add your Claude API key in
                Settings.
              </p>
            )}
            {suggestions && (
              <div className="flex flex-col gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
                {suggestions.length === 0 ? (
                  <span className="text-sm text-muted">
                    AI found no clear rule violations today.
                  </span>
                ) : (
                  suggestions.map((s) => {
                    const alreadyAdded = data.ruleViolationIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div>
                          <span className="font-medium text-foreground">
                            {s.label}
                          </span>
                          <p className="text-xs text-muted">{s.reason}</p>
                        </div>
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() =>
                            set("ruleViolationIds", [
                              ...data.ruleViolationIds,
                              s.id,
                            ])
                          }
                          className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-foreground hover:bg-surface-raised disabled:opacity-50"
                        >
                          {alreadyAdded ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-loss">{error}</p>}

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <button
          type="button"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted disabled:opacity-40"
        >
          Back
        </button>
        {stepIndex < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() =>
              setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
            }
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save day"}
          </button>
        )}
      </div>
    </div>
  );
}

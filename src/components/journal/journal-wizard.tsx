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
import type { PreMarketChecklist } from "@/lib/types/premarket-checklist";
import {
  MINDSET_RESET_ITEMS,
  STRUCTURE_OPTIONS,
  DOL_OPTIONS,
} from "@/lib/types/premarket-checklist";
import {
  SCORECARD_CATEGORIES,
  SCORECARD_MAX_POINTS,
  scorecardTotal,
  scorecardBand,
} from "@/lib/types/scorecard";

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

  function setChecklist(patch: Partial<PreMarketChecklist>) {
    set("preMarketChecklist", { ...data.preMarketChecklist, ...patch });
  }

  function setMindset(
    key: keyof PreMarketChecklist["mindsetReset"],
    val: boolean,
  ) {
    setChecklist({
      mindsetReset: { ...data.preMarketChecklist.mindsetReset, [key]: val },
    });
  }

  function setSessionAnalysis(
    patch: Partial<PreMarketChecklist["sessionAnalysis"]>,
  ) {
    setChecklist({
      sessionAnalysis: { ...data.preMarketChecklist.sessionAnalysis, ...patch },
    });
  }

  function setPersonalCheck(
    patch: Partial<PreMarketChecklist["personalCheck"]>,
  ) {
    setChecklist({
      personalCheck: { ...data.preMarketChecklist.personalCheck, ...patch },
    });
  }

  function setScoreFor(key: string, points: number) {
    set("scorecard", {
      ...data.scorecard,
      [key]: data.scorecard[key] === points ? null : points,
    });
  }

  function toggleDol(key: string) {
    const current = data.preMarketChecklist.drawOnLiquidity;
    setChecklist({
      drawOnLiquidity: current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key],
    });
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
        <div className="flex flex-col gap-6">
          <Field label="Date">
            <TextInput
              type="date"
              value={data.date}
              onChange={(e) => set("date", e.target.value)}
              className="max-w-xs"
            />
          </Field>

          <PlanSection title="🧘 Mindset & Physiology Reset (5 min)">
            <div className="flex flex-col gap-2">
              {MINDSET_RESET_ITEMS.map((item) => (
                <CheckRow
                  key={item.key}
                  label={item.label}
                  checked={data.preMarketChecklist.mindsetReset[item.key]}
                  onChange={(v) => setMindset(item.key, v)}
                />
              ))}
            </div>
          </PlanSection>

          <PlanSection title="🔍 Session Analysis">
            <Field label="Instrument">
              <TextInput
                value={data.preMarketChecklist.symbol}
                onChange={(e) => setChecklist({ symbol: e.target.value })}
                placeholder="NQ"
                className="max-w-xs"
              />
            </Field>
            <Field
              label={`Has there been a large expansion recently? (${data.preMarketChecklist.symbol || "instrument"}, M15)`}
            >
              <TextInput
                value={data.preMarketChecklist.sessionAnalysis.expansionNote}
                onChange={(e) =>
                  setSessionAnalysis({ expansionNote: e.target.value })
                }
                placeholder="Over 400pts during overnight session"
              />
            </Field>
            <YesNoRow
              label="Recent expansion?"
              value={data.preMarketChecklist.sessionAnalysis.hadRecentExpansion}
              onChange={(v) => setSessionAnalysis({ hadRecentExpansion: v })}
            />
            {data.preMarketChecklist.sessionAnalysis.hadRecentExpansion && (
              <Field label="Caution note">
                <TextInput
                  value={data.preMarketChecklist.sessionAnalysis.cautionNote}
                  onChange={(e) =>
                    setSessionAnalysis({ cautionNote: e.target.value })
                  }
                  placeholder="Be cautious, will likely chop"
                />
              </Field>
            )}
          </PlanSection>

          <PlanSection
            title={`${data.preMarketChecklist.symbol || "HTF"} 4H structure`}
          >
            <PillGroup
              options={STRUCTURE_OPTIONS}
              value={data.preMarketChecklist.htf4hStructure}
              onChange={(v) => setChecklist({ htf4hStructure: v })}
            />
          </PlanSection>

          <PlanSection
            title={`${data.preMarketChecklist.symbol || "HTF"} 1H structure`}
          >
            <PillGroup
              options={STRUCTURE_OPTIONS}
              value={data.preMarketChecklist.htf1hStructure}
              onChange={(v) => setChecklist({ htf1hStructure: v })}
            />
          </PlanSection>

          <PlanSection title="Daily bias">
            <p className="-mt-1 text-xs text-muted">
              Determine Daily Bias based on where price is located within
              daily range.
            </p>
            <Field label="Range location">
              <PillGroup
                options={[
                  { key: "premium", label: "Premium" },
                  { key: "discount", label: "Discount" },
                  { key: "equilibrium", label: "Equilibrium" },
                ]}
                value={data.preMarketChecklist.dailyRangeLocation}
                onChange={(v) =>
                  setChecklist({
                    dailyRangeLocation: v as PreMarketChecklist["dailyRangeLocation"],
                  })
                }
              />
            </Field>
            <Field label="Bias">
              <PillGroup
                options={[
                  { key: "bullish", label: "Bullish" },
                  { key: "bearish", label: "Bearish" },
                  { key: "neutral", label: "Neutral" },
                ]}
                value={data.preMarketChecklist.biasDirection}
                onChange={(v) =>
                  setChecklist({
                    biasDirection: v as PreMarketChecklist["biasDirection"],
                  })
                }
              />
            </Field>
          </PlanSection>

          <PlanSection title="💧 Draw on Liquidity (DOL) (5m/15m/1h)">
            <span className="text-xs font-medium text-muted">
              Select Draw on Liquidity (DOL):
            </span>
            <div className="flex flex-col gap-2">
              {DOL_OPTIONS.map((opt) => (
                <CheckRow
                  key={opt.key}
                  label={opt.label}
                  hint={opt.hint}
                  checked={data.preMarketChecklist.drawOnLiquidity.includes(
                    opt.key,
                  )}
                  onChange={() => toggleDol(opt.key)}
                />
              ))}
            </div>
            <span className="mt-2 text-xs font-medium text-muted">
              Liquidity Modeling — where is price likely to go first?
            </span>
            <CheckRow
              label="Map the likely sweep → reversal zone → expansion path"
              checked={data.preMarketChecklist.liquidityModelingDone}
              onChange={(v) => setChecklist({ liquidityModelingDone: v })}
            />
          </PlanSection>

          <PlanSection title="🛡️ Personal Check">
            <YesNoRow
              label="Energy level 7/10 or better?"
              value={data.preMarketChecklist.personalCheck.energyOk}
              onChange={(v) => setPersonalCheck({ energyOk: v })}
            />
            <YesNoRow
              label="Slept 6+ hours? (NO TRADES IF LESS THAN 6 HOURS OF SLEEP)"
              value={data.preMarketChecklist.personalCheck.sleptEnough}
              onChange={(v) => setPersonalCheck({ sleptEnough: v })}
            />
            <YesNoRow
              label="Am I emotionally neutral before the session?"
              value={data.preMarketChecklist.personalCheck.emotionallyNeutral}
              onChange={(v) => setPersonalCheck({ emotionallyNeutral: v })}
            />
            <YesNoRow
              label="Is there a big stressor I'm dealing with right now?"
              value={data.preMarketChecklist.personalCheck.hasStressor}
              onChange={(v) => setPersonalCheck({ hasStressor: v })}
            />
            {data.preMarketChecklist.personalCheck.hasStressor && (
              <Field label="Explain">
                <TextInput
                  value={data.preMarketChecklist.personalCheck.stressorNote}
                  onChange={(e) =>
                    setPersonalCheck({ stressorNote: e.target.value })
                  }
                />
              </Field>
            )}
            <YesNoRow
              label="Am I here to follow process, not chase payout?"
              value={data.preMarketChecklist.personalCheck.followingProcess}
              onChange={(v) => setPersonalCheck({ followingProcess: v })}
            />
          </PlanSection>

          <PlanSection title="Plan notes & risk">
            <div className="grid grid-cols-2 gap-4">
              <Field label="HTF bias notes">
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
          </PlanSection>

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
          <PlanSection title="📊 Daily Process Scorecard">
            <div className="flex flex-col">
              {SCORECARD_CATEGORIES.map((cat) => (
                <div
                  key={cat.key}
                  className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {cat.label}
                    </p>
                    <p className="text-xs text-muted">{cat.description}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = data.scorecard[cat.key] === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setScoreFor(cat.key, n)}
                          className={clsx(
                            "h-7 w-7 rounded-full border text-xs font-medium transition-colors",
                            active
                              ? "border-accent bg-accent/20 text-foreground"
                              : "border-border bg-surface text-muted hover:text-foreground",
                          )}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {(() => {
              const total = scorecardTotal(data.scorecard);
              const band = scorecardBand(total);
              return (
                <div className="flex flex-col gap-1 border-t border-border pt-3">
                  <span className="text-sm font-semibold text-foreground">
                    🏆 TOTAL DAILY SCORE: {total} / {SCORECARD_MAX_POINTS}
                  </span>
                  <span className={clsx("text-xs font-medium", band.colorClass)}>
                    {band.label}
                  </span>
                  <span className="text-xs text-muted">
                    45+ = Elite Discipline Day · 35–44 = Solid but Review What
                    Slipped · &lt;35 = Audit Yourself + Rewrite Intentions
                  </span>
                </div>
              );
            })()}
          </PlanSection>
          <blockquote className="rounded-xl border border-border bg-surface p-5 text-center text-sm italic text-muted">
            <p>
              &ldquo;I am a professional operator. My job is to execute my
              process.
            </p>
            <p className="mt-2">
              I do not chase. I do not gamble. I do not deviate.
            </p>
            <p className="mt-2">
              Every day I get more precise, more calm, more
              disciplined.&rdquo;
            </p>
          </blockquote>
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

function PlanSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string; bias?: string }[];
  value: string | null;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-accent bg-accent/20 text-foreground"
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            {opt.label}
            {opt.bias && (
              <span className="ml-1 opacity-60">| {opt.bias}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex gap-2">
        {([true, false] as const).map((opt) => {
          const active = value === opt;
          return (
            <button
              key={String(opt)}
              type="button"
              onClick={() => onChange(opt)}
              className={clsx(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-accent bg-accent/20 text-foreground"
                  : "border-border bg-surface text-muted hover:text-foreground",
              )}
            >
              {opt ? "Yes" : "No"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

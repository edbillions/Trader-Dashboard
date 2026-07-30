import { clsx } from "clsx";
import {
  CRITERIA_WEIGHTS,
  DOL_TARGET_LABELS,
  HTFPD_LEVEL_LABELS,
  LIQ_SWEPT_LABELS,
} from "@/app/setup-grader/grading";
import type { SetupFactorsChecklist } from "@/lib/types/setup-factors-checklist";

const TOTAL_WEIGHT = (Object.values(CRITERIA_WEIGHTS) as number[]).reduce(
  (a, b) => a + b,
  0,
);

export function SetupFactorsSection({
  value,
  onChange,
}: {
  value: SetupFactorsChecklist;
  onChange: (next: SetupFactorsChecklist) => void;
}) {
  function set<K extends keyof SetupFactorsChecklist>(
    key: K,
    val: SetupFactorsChecklist[K],
  ) {
    onChange({ ...value, [key]: val });
  }

  function toggleInArray(key: "liquiditySwept" | "htfFvgLevels", item: string) {
    const current = value[key];
    set(
      key,
      current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item],
    );
  }

  const confirmedFlags: (keyof SetupFactorsChecklist)[] = [
    "biasConfirmed",
    "dolIdentified",
    "liquiditySweepConfirmed",
    "htfDeliveryConfirmed",
    "premiumDiscountConfirmed",
    "breakerBlockConfirmed",
    "notAt2RConfirmed",
    "macroWindowConfirmed",
  ];
  const weightKeys: (keyof typeof CRITERIA_WEIGHTS)[] = [
    "bias",
    "dol",
    "liq",
    "htfpd",
    "pd",
    "bb",
    "2r",
    "macro",
  ];
  const earned = confirmedFlags.reduce(
    (sum, flag, i) => (value[flag] ? sum + CRITERIA_WEIGHTS[weightKeys[i]] : sum),
    0,
  );
  const confirmedCount = confirmedFlags.filter((f) => value[f]).length;

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-muted">Setup Factors — Unicorn Model checklist</p>
        <span className="text-xs text-muted">
          {confirmedCount}/8 confirmed · {earned}/{TOTAL_WEIGHT} pts
        </span>
      </div>

      <label className="mb-3 flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2">
        <span className="text-sm font-medium text-foreground">
          ⚡ Killzone — NY AM Session (9:30 AM–12:15 PM EST)
        </span>
        <input
          type="checkbox"
          checked={value.killzoneConfirmed}
          onChange={(e) => set("killzoneConfirmed", e.target.checked)}
        />
      </label>

      <SectionLabel>Bias & DOL (HTF – 1D / 4H)</SectionLabel>
      <FactorRow
        label="Bias Confirmed"
        note="Determine bias from price location in range OR IRL/ERL. Where is price delivering from?"
        example="→ Use Daily, 4H, 15M chart"
        weight={CRITERIA_WEIGHTS.bias}
        checked={value.biasConfirmed}
        onToggle={() => set("biasConfirmed", !value.biasConfirmed)}
      />
      <FactorRow
        label="Clear DOL Identified"
        note="Select the liquidity level you are targeting:"
        example="→ Target 2R minimum"
        weight={CRITERIA_WEIGHTS.dol}
        checked={value.dolIdentified}
        onToggle={() => set("dolIdentified", !value.dolIdentified)}
      >
        <SubPanelLabel>Targeting</SubPanelLabel>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.entries(DOL_TARGET_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 text-xs text-foreground">
              <input
                type="radio"
                name="dol-target"
                checked={value.dolTarget === key}
                onChange={() => set("dolTarget", key)}
              />
              {label}
            </label>
          ))}
        </div>
      </FactorRow>

      <SectionLabel>Structure & PD Arrays (1H / 15M)</SectionLabel>
      <FactorRow
        label="Sweep of Major Liquidity"
        note="Select which liquidity has been swept (multiple allowed):"
        example="→ When price doesn't displace above/below liq — lightbulb moment!"
        weight={CRITERIA_WEIGHTS.liq}
        checked={value.liquiditySweepConfirmed}
        onToggle={() => set("liquiditySweepConfirmed", !value.liquiditySweepConfirmed)}
      >
        <SubPanelLabel>Swept / Tagged</SubPanelLabel>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.entries(LIQ_SWEPT_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 text-xs text-foreground">
              <input
                type="checkbox"
                checked={value.liquiditySwept.includes(key)}
                onChange={() => toggleInArray("liquiditySwept", key)}
              />
              {label}
            </label>
          ))}
        </div>
      </FactorRow>
      <FactorRow
        label="HTF Delivery From PD Array (FVG)"
        note="Price delivering from a higher timeframe FVG (multiple levels allowed):"
        example="→ Confirms institutional order flow into entry"
        weight={CRITERIA_WEIGHTS.htfpd}
        checked={value.htfDeliveryConfirmed}
        onToggle={() => set("htfDeliveryConfirmed", !value.htfDeliveryConfirmed)}
      >
        <SubPanelLabel>HTF FVG Level</SubPanelLabel>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.entries(HTFPD_LEVEL_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 text-xs text-foreground">
              <input
                type="checkbox"
                checked={value.htfFvgLevels.includes(key)}
                onChange={() => toggleInArray("htfFvgLevels", key)}
              />
              {label}
            </label>
          ))}
        </div>
      </FactorRow>
      <FactorRow
        label="Right Side of Premium / Discount"
        note="Determined using daily range indicator or FIB."
        example="→ Long in discount · Sell in premium · Avoid breakout setups"
        weight={CRITERIA_WEIGHTS.pd}
        checked={value.premiumDiscountConfirmed}
        onToggle={() => set("premiumDiscountConfirmed", !value.premiumDiscountConfirmed)}
      />

      <SectionLabel>Unicorn Formation (5M / 1M / 15M)</SectionLabel>
      <FactorRow
        label="Breaker Block w/ Displacement (FVG)"
        note="Valid Breaker Block (ISPs confirmed) + Displacement through it with aligned FVG."
        example="→ Highest/lowest closed candle(s) before liq taken · Must displace through with FVG"
        weight="KO"
        knockout
        checked={value.breakerBlockConfirmed}
        onToggle={() => set("breakerBlockConfirmed", !value.breakerBlockConfirmed)}
      />
      <FactorRow
        label="Price NOT at 2R / 2 StdDev"
        note="No trades if setup has already gone 2R from the breaker."
        example="→ Confirm the move is still fresh"
        weight={CRITERIA_WEIGHTS["2r"]}
        checked={value.notAt2RConfirmed}
        onToggle={() => set("notAt2RConfirmed", !value.notAt2RConfirmed)}
      />

      <SectionLabel>Confluences</SectionLabel>
      <FactorRow
        label="Macro Window"
        note="9:45–10:15 am · 10:45–11:15 am · 11:45–12:15 pm"
        example="→ Not mandatory but adds significant confluence"
        weight={CRITERIA_WEIGHTS.macro}
        checked={value.macroWindowConfirmed}
        onToggle={() => set("macroWindowConfirmed", !value.macroWindowConfirmed)}
      />
      <FactorRow
        label="🦄 Unicorn Indicator Alerted"
        note="Did the Unicorn indicator fire an alert on this setup?"
        example="→ Confirmation only — do not force setups without it"
        weight="—"
        checked={value.unicornIndicatorAlerted}
        onToggle={() => set("unicornIndicatorAlerted", !value.unicornIndicatorAlerted)}
        last
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wide text-accent first:mt-0">
      ◈ {children}
    </p>
  );
}

function SubPanelLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 mt-2 text-[10px] font-medium uppercase tracking-wide text-muted">▸ {children}</p>;
}

function FactorRow({
  label,
  note,
  example,
  weight,
  checked,
  onToggle,
  knockout,
  last,
  children,
}: {
  label: string;
  note: string;
  example: string;
  weight: number | string;
  checked: boolean;
  onToggle: () => void;
  knockout?: boolean;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-2.5",
        !last && "mb-2",
        knockout && !checked
          ? "border-loss/40 bg-loss-muted"
          : checked
            ? "border-accent/40 bg-accent/5"
            : "border-border bg-surface-raised",
      )}
    >
      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <span
              className={clsx(
                "shrink-0 text-xs font-semibold",
                knockout ? "text-loss" : "text-muted",
              )}
            >
              {weight}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">{note}</p>
          <p className="text-xs text-accent">{example}</p>
          {knockout && !checked && (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-loss">
              ⚠ Knockout — no trade without this
            </p>
          )}
        </div>
      </label>
      {children && <div className="ml-6 mt-2">{children}</div>}
    </div>
  );
}

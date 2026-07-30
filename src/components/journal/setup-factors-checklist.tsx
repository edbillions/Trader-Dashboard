import {
  CRITERIA_WEIGHTS,
  DOL_TARGET_LABELS,
  HTFPD_LEVEL_LABELS,
  LIQ_SWEPT_LABELS,
} from "@/app/setup-grader/grading";
import { computeSetupFactorsScore } from "@/lib/domain/setup-factors";
import type { SetupFactorsChecklist } from "@/lib/types/setup-factors-checklist";

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

  const score = computeSetupFactorsScore(value);

  return (
    <div className="rounded-lg border border-border bg-surface p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted">Setup Factors</p>
        <span className="text-[11px] text-muted">
          {score.confirmedCount}/8 · {score.totalEarned}/{score.maxPossible} pts
          {(score.liquidityBonus > 0 || score.htfFvgBonus > 0) && (
            <span className="ml-1 text-accent">
              (+{score.liquidityBonus + score.htfFvgBonus} confluence)
            </span>
          )}
        </span>
      </div>

      <FactorRow
        label="⚡ Killzone — NY AM (9:30–12:15 EST)"
        weight={null}
        checked={value.killzoneConfirmed}
        onToggle={() => set("killzoneConfirmed", !value.killzoneConfirmed)}
      />

      <SectionLabel>Bias & DOL</SectionLabel>
      <FactorRow
        label="Bias Confirmed"
        weight={CRITERIA_WEIGHTS.bias}
        checked={value.biasConfirmed}
        onToggle={() => set("biasConfirmed", !value.biasConfirmed)}
      />
      <FactorRow
        label="Clear DOL Identified"
        weight={CRITERIA_WEIGHTS.dol}
        checked={value.dolIdentified}
        onToggle={() => set("dolIdentified", !value.dolIdentified)}
      >
        <RadioChips
          name="dol-target"
          options={DOL_TARGET_LABELS}
          selected={value.dolTarget}
          onSelect={(key) => set("dolTarget", key)}
        />
      </FactorRow>

      <SectionLabel>Structure & PD Arrays</SectionLabel>
      <FactorRow
        label="Sweep of Major Liquidity"
        weight={CRITERIA_WEIGHTS.liq}
        bonus={score.liquidityBonus}
        checked={value.liquiditySweepConfirmed}
        onToggle={() => set("liquiditySweepConfirmed", !value.liquiditySweepConfirmed)}
      >
        <CheckboxChips
          options={LIQ_SWEPT_LABELS}
          selected={value.liquiditySwept}
          onToggle={(key) => toggleInArray("liquiditySwept", key)}
        />
      </FactorRow>
      <FactorRow
        label="HTF Delivery From PD Array (FVG)"
        weight={CRITERIA_WEIGHTS.htfpd}
        bonus={score.htfFvgBonus}
        checked={value.htfDeliveryConfirmed}
        onToggle={() => set("htfDeliveryConfirmed", !value.htfDeliveryConfirmed)}
      >
        <CheckboxChips
          options={HTFPD_LEVEL_LABELS}
          selected={value.htfFvgLevels}
          onToggle={(key) => toggleInArray("htfFvgLevels", key)}
        />
      </FactorRow>
      <FactorRow
        label="Right Side of Premium / Discount"
        weight={CRITERIA_WEIGHTS.pd}
        checked={value.premiumDiscountConfirmed}
        onToggle={() => set("premiumDiscountConfirmed", !value.premiumDiscountConfirmed)}
      />

      <SectionLabel>Unicorn Formation</SectionLabel>
      <FactorRow
        label="Breaker Block w/ Displacement (FVG)"
        weight={CRITERIA_WEIGHTS.bb}
        checked={value.breakerBlockConfirmed}
        onToggle={() => set("breakerBlockConfirmed", !value.breakerBlockConfirmed)}
      />
      <FactorRow
        label="Price NOT at 2R / 2 StdDev"
        weight={CRITERIA_WEIGHTS["2r"]}
        checked={value.notAt2RConfirmed}
        onToggle={() => set("notAt2RConfirmed", !value.notAt2RConfirmed)}
      />

      <SectionLabel>Confluences</SectionLabel>
      <FactorRow
        label="Macro Window"
        weight={CRITERIA_WEIGHTS.macro}
        checked={value.macroWindowConfirmed}
        onToggle={() => set("macroWindowConfirmed", !value.macroWindowConfirmed)}
      />
      <FactorRow
        label="🦄 Unicorn Indicator Alerted"
        weight={null}
        checked={value.unicornIndicatorAlerted}
        onToggle={() => set("unicornIndicatorAlerted", !value.unicornIndicatorAlerted)}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-0.5 mt-2 text-[10px] font-semibold uppercase tracking-wide text-accent first:mt-0">
      {children}
    </p>
  );
}

function RadioChips({
  name,
  options,
  selected,
  onSelect,
}: {
  name: string;
  options: Record<string, string>;
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
      {Object.entries(options).map(([key, label]) => (
        <label key={key} className="flex items-center gap-1 text-[11px] text-muted">
          <input
            type="radio"
            name={name}
            checked={selected === key}
            onChange={() => onSelect(key)}
            className="h-3 w-3"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

function CheckboxChips({
  options,
  selected,
  onToggle,
}: {
  options: Record<string, string>;
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
      {Object.entries(options).map(([key, label]) => (
        <label key={key} className="flex items-center gap-1 text-[11px] text-muted">
          <input
            type="checkbox"
            checked={selected.includes(key)}
            onChange={() => onToggle(key)}
            className="h-3 w-3"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

function FactorRow({
  label,
  weight,
  bonus,
  checked,
  onToggle,
  children,
}: {
  label: string;
  weight: number | string | null;
  bonus?: number;
  checked: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/60 py-1 last:border-0">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-3.5 w-3.5 shrink-0"
        />
        <span className="flex-1 text-xs text-foreground">{label}</span>
        {!!bonus && <span className="shrink-0 text-[10px] text-accent">+{bonus}</span>}
        {weight != null && (
          <span className="shrink-0 text-[10px] text-muted">{weight}</span>
        )}
      </label>
      {children && <div className="ml-5">{children}</div>}
    </div>
  );
}

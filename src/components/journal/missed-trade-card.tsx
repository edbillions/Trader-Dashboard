"use client";

import type { MissedTradeInput } from "@/lib/types/journal";
import type { WizardLookups } from "@/lib/data/lookups";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { DatalistInput } from "@/components/ui/datalist-input";
import { ChipMultiSelect } from "@/components/ui/chip-multiselect";

export function MissedTradeCard({
  index,
  value,
  onChange,
  onRemove,
  lookups,
}: {
  index: number;
  value: MissedTradeInput;
  onChange: (next: MissedTradeInput) => void;
  onRemove: () => void;
  lookups: WizardLookups;
}) {
  function set<K extends keyof MissedTradeInput>(
    key: K,
    val: MissedTradeInput[K],
  ) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Missed trade {index + 1}
          {value.symbol ? ` — ${value.symbol.toUpperCase()}` : ""}
        </h3>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium text-loss hover:underline"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Symbol">
          <TextInput
            value={value.symbol}
            onChange={(e) => set("symbol", e.target.value)}
            placeholder="NQ"
          />
        </Field>
        <Field label="Session/Killzone">
          <DatalistInput
            options={lookups.sessions.map((s) => s.label)}
            value={value.session}
            onChange={(e) => set("session", e.target.value)}
          />
        </Field>
        <Field label="Entry model">
          <DatalistInput
            options={lookups.entryModels.map((m) => m.label)}
            value={value.entryModel}
            onChange={(e) => set("entryModel", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Setup description">
          <TextArea
            value={value.setupDescription}
            onChange={(e) => set("setupDescription", e.target.value)}
            placeholder="What was the setup? Where was entry/stop/target?"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Why you missed it">
          <TextArea
            value={value.reasonMissed}
            onChange={(e) => set("reasonMissed", e.target.value)}
            placeholder="Hesitation, distracted, already at max trade count..."
          />
        </Field>
      </div>

      <div className="mt-4">
        <ChipMultiSelect
          label="Confluence factors"
          options={lookups.confluenceFactors.map((c) => ({
            id: c.id,
            label: c.label,
          }))}
          selectedIds={value.confluenceFactorIds}
          onChange={(ids) => set("confluenceFactorIds", ids)}
        />
      </div>
    </div>
  );
}

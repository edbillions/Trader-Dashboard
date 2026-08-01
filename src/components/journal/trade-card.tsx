"use client";

import { useEffect, useState, useTransition } from "react";
import { calculateTrade, formatCurrency, formatR } from "@/lib/pnl";
import { uploadScreenshotAction } from "@/lib/actions/journal";
import type { TradeInput } from "@/lib/types/journal";
import type { WizardLookups } from "@/lib/data/lookups";
import { Field, TextInput, TextArea, Select } from "@/components/ui/field";
import { DatalistInput } from "@/components/ui/datalist-input";
import { ChipMultiSelect } from "@/components/ui/chip-multiselect";
import { TagCategoryPicker } from "@/components/ui/tag-category-picker";
import { SetupFactorsSection } from "@/components/journal/setup-factors-checklist";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/domain/account-type";

export function TradeCard({
  index,
  value,
  onChange,
  onRemove,
  lookups,
}: {
  index: number;
  value: TradeInput;
  onChange: (next: TradeInput) => void;
  onRemove: () => void;
  lookups: WizardLookups;
}) {
  const [isUploading, startUpload] = useTransition();
  const [mfePriceStr, setMfePriceStr] = useState("");
  const [maePriceStr, setMaePriceStr] = useState("");
  // Local picking aid only, not saved anywhere — narrows the Account
  // dropdown below. Keeps the currently selected account visible even if
  // it doesn't match the filter, so switching the filter never silently
  // clears an existing selection.
  const [accountTypeFilter, setAccountTypeFilter] = useState("");

  function set<K extends keyof TradeInput>(key: K, val: TradeInput[K]) {
    onChange({ ...value, [key]: val });
  }

  const riskPoints =
    value.stopLossPlanned != null && Number.isFinite(value.entryPrice)
      ? Math.abs(value.entryPrice - value.stopLossPlanned)
      : null;

  function excursionR(priceStr: string, kind: "mfe" | "mae"): number | null {
    const price = Number(priceStr);
    if (priceStr === "" || !Number.isFinite(price) || !riskPoints) return null;
    const favorable = kind === "mfe";
    const isLong = value.direction === "long";
    const useAbove = (isLong && favorable) || (!isLong && !favorable);
    const points = useAbove ? price - value.entryPrice : value.entryPrice - price;
    return Math.max(0, points) / riskPoints;
  }

  const computedMfeR = excursionR(mfePriceStr, "mfe");
  const computedMaeR = excursionR(maePriceStr, "mae");

  useEffect(() => {
    if (mfePriceStr !== "") set("mfeR", computedMfeR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedMfeR, mfePriceStr]);

  useEffect(() => {
    if (maePriceStr !== "") set("maeR", computedMaeR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedMaeR, maePriceStr]);

  const instrument = lookups.instruments.find(
    (i) => i.symbol.toUpperCase() === value.symbol.toUpperCase(),
  );
  const preview = calculateTrade({
    direction: value.direction,
    entryPrice: value.entryPrice,
    exitPrice: value.exitPrice,
    positionSize: value.positionSize,
    commission: value.commission,
    stopLossPlanned: value.stopLossPlanned,
    entryTime: value.entryTime || new Date().toISOString(),
    exitTime: value.exitTime,
    instrument: instrument
      ? { tickValue: instrument.tickValue, tickSize: instrument.tickSize }
      : null,
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    startUpload(async () => {
      const result = await uploadScreenshotAction(formData);
      set("screenshotPaths", [...value.screenshotPaths, result.path]);
    });
    e.target.value = "";
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Trade {index + 1}
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Symbol">
          <DatalistInput
            options={lookups.instruments.map((i) => i.symbol)}
            value={value.symbol}
            onChange={(e) => set("symbol", e.target.value)}
            placeholder="ES"
          />
        </Field>
        <Field label="Direction">
          <Select
            value={value.direction}
            onChange={(e) =>
              set("direction", e.target.value as "long" | "short")
            }
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </Select>
        </Field>
        <Field label="Account type">
          <Select
            value={accountTypeFilter}
            onChange={(e) => setAccountTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Account">
          <Select
            value={value.accountId ?? ""}
            onChange={(e) => set("accountId", e.target.value || null)}
          >
            <option value="">— none —</option>
            {lookups.accounts
              .filter(
                (a) =>
                  !accountTypeFilter ||
                  a.accountType === accountTypeFilter ||
                  a.id === value.accountId,
              )
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.firmName} · {a.accountName} ({ACCOUNT_TYPE_LABELS[a.accountType] ?? a.accountType})
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Position size (contracts)">
          <TextInput
            type="number"
            min={1}
            value={value.positionSize}
            onChange={(e) => set("positionSize", Number(e.target.value))}
          />
        </Field>

        <Field label="Entry price">
          <TextInput
            type="number"
            step="any"
            value={Number.isNaN(value.entryPrice) ? "" : value.entryPrice}
            onChange={(e) => set("entryPrice", Number(e.target.value))}
          />
        </Field>
        <Field label="Exit price">
          <TextInput
            type="number"
            step="any"
            value={value.exitPrice ?? ""}
            onChange={(e) =>
              set(
                "exitPrice",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </Field>
        <Field label="Entry time">
          <TextInput
            type="datetime-local"
            value={value.entryTime}
            onChange={(e) => set("entryTime", e.target.value)}
          />
        </Field>
        <Field label="Exit time">
          <TextInput
            type="datetime-local"
            value={value.exitTime ?? ""}
            onChange={(e) => set("exitTime", e.target.value || null)}
          />
        </Field>

        <Field label="Stop loss (planned)">
          <TextInput
            type="number"
            step="any"
            value={value.stopLossPlanned ?? ""}
            onChange={(e) =>
              set(
                "stopLossPlanned",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </Field>
        <Field label="Stop loss (actual)">
          <TextInput
            type="number"
            step="any"
            value={value.stopLossActual ?? ""}
            onChange={(e) =>
              set(
                "stopLossActual",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </Field>
        <Field label="Target (planned)">
          <TextInput
            type="number"
            step="any"
            value={value.targetPlanned ?? ""}
            onChange={(e) =>
              set(
                "targetPlanned",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </Field>
        <Field label="Target (actual)">
          <TextInput
            type="number"
            step="any"
            value={value.targetActual ?? ""}
            onChange={(e) =>
              set(
                "targetActual",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </Field>

        <Field label="Commission">
          <TextInput
            type="number"
            step="any"
            value={value.commission ?? ""}
            onChange={(e) =>
              set(
                "commission",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </Field>
        <Field label="Setup grade">
          <Select
            value={value.setupGrade}
            onChange={(e) => set("setupGrade", e.target.value)}
          >
            <option value="">—</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </Select>
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
        <Field label="Entry timeframe">
          <Select
            value={value.entryTimeframe}
            onChange={(e) => set("entryTimeframe", e.target.value)}
          >
            <option value="">—</option>
            <option value="1m">1m</option>
            <option value="3m">3m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
          </Select>
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <Field label="HTF chart link">
          <TextInput
            type="url"
            value={value.htfChartLink}
            onChange={(e) => set("htfChartLink", e.target.value)}
            placeholder="https://www.tradingview.com/x/..."
          />
        </Field>
        <Field label="Intermediate chart link">
          <TextInput
            type="url"
            value={value.intermediateChartLink}
            onChange={(e) => set("intermediateChartLink", e.target.value)}
            placeholder="https://www.tradingview.com/x/..."
          />
        </Field>
        <Field label="Entry chart link">
          <TextInput
            type="url"
            value={value.entryChartLink}
            onChange={(e) => set("entryChartLink", e.target.value)}
            placeholder="https://www.tradingview.com/x/..."
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <Field label="Daily bias">
          <TextInput
            value={value.dailyBias}
            onChange={(e) => set("dailyBias", e.target.value)}
            placeholder="Bullish"
          />
        </Field>
        <Field label="HTF POI">
          <TextInput
            value={value.htfPoi}
            onChange={(e) => set("htfPoi", e.target.value)}
            placeholder="Prior day high FVG"
          />
        </Field>
        <Field label="HTF DOL">
          <TextInput
            value={value.htfDol}
            onChange={(e) => set("htfDol", e.target.value)}
            placeholder="Weekly high"
          />
        </Field>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-3">
        <p className="mb-3 text-xs font-medium text-muted">
          Excursion calculator — enter the price it reached, R is calculated
          for you from entry price and stop loss (planned).
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Field
              label={
                value.direction === "short"
                  ? "Lowest price reached (MFE)"
                  : "Highest price reached (MFE)"
              }
            >
              <TextInput
                type="number"
                step="any"
                value={mfePriceStr}
                onChange={(e) => setMfePriceStr(e.target.value)}
                placeholder={value.direction === "short" ? "e.g. 19970" : "e.g. 20030"}
              />
            </Field>
            <p className="mt-1 text-xs text-muted">
              {riskPoints == null
                ? "Set entry price and stop loss (planned) first."
                : mfePriceStr === ""
                  ? value.mfeR != null
                    ? `Currently saved: ${value.mfeR.toFixed(2)}R`
                    : "No MFE logged yet."
                  : computedMfeR != null
                    ? `→ ${computedMfeR.toFixed(2)}R MFE`
                    : "—"}
            </p>
          </div>
          <div>
            <Field
              label={
                value.direction === "short"
                  ? "Highest price reached (MAE)"
                  : "Lowest price reached (MAE)"
              }
            >
              <TextInput
                type="number"
                step="any"
                value={maePriceStr}
                onChange={(e) => setMaePriceStr(e.target.value)}
                placeholder={value.direction === "short" ? "e.g. 20004" : "e.g. 19996"}
              />
            </Field>
            <p className="mt-1 text-xs text-muted">
              {riskPoints == null
                ? "Set entry price and stop loss (planned) first."
                : maePriceStr === ""
                  ? value.maeR != null
                    ? `Currently saved: ${value.maeR.toFixed(2)}R`
                    : "No MAE logged yet."
                  : computedMaeR != null
                    ? `→ ${computedMaeR.toFixed(2)}R MAE`
                    : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <SetupFactorsSection
          value={value.setupFactors}
          onChange={(next) => set("setupFactors", next)}
          onApplyGrade={(letter) => set("setupGrade", letter)}
        />
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

      <div className="mt-4">
        <ChipMultiSelect
          label="Mistakes"
          options={lookups.mistakeTypes.map((m) => ({
            id: m.id,
            label: m.label,
          }))}
          selectedIds={value.mistakeIds}
          onChange={(ids) => set("mistakeIds", ids)}
        />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-3">
        <p className="mb-3 text-xs font-medium text-muted">
          Tags — one per category, tracked in Analytics.
        </p>
        <TagCategoryPicker
          categories={lookups.tagCategories.filter(
            (c) => c.name !== "Missed Trade Reason",
          )}
          selectedIds={value.tagIds}
          onChange={(ids) => set("tagIds", ids)}
        />
      </div>

      <div className="mt-4">
        <Field label="Writeup">
          <TextArea
            value={value.writeup}
            onChange={(e) => set("writeup", e.target.value)}
            placeholder="What happened, why you took it, how it played out..."
          />
        </Field>
      </div>

      <div className="mt-4">
        <span className="text-xs font-medium text-muted">Screenshots</span>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {value.screenshotPaths.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p}
              src={p}
              alt="Trade screenshot"
              className="h-16 w-16 rounded-lg border border-border object-cover"
            />
          ))}
          <label className="cursor-pointer rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted hover:text-foreground">
            {isUploading ? "Uploading..." : "+ Add screenshot"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 border-t border-border pt-4 text-sm">
        <span className="text-muted">
          Gross P&L:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(preview.grossPnl)}
          </span>
        </span>
        <span className="text-muted">
          Net P&L:{" "}
          <span
            className={
              (preview.netPnl ?? 0) >= 0
                ? "font-medium text-profit"
                : "font-medium text-loss"
            }
          >
            {formatCurrency(preview.netPnl)}
          </span>
        </span>
        <span className="text-muted">
          R-multiple:{" "}
          <span className="font-medium text-foreground">
            {formatR(preview.rMultiple)}
          </span>
        </span>
        {!instrument && value.symbol && (
          <span className="text-xs text-loss">
            No tick value configured for &quot;{value.symbol}&quot; — add it
            in Settings to auto-calc P&L.
          </span>
        )}
      </div>
    </div>
  );
}

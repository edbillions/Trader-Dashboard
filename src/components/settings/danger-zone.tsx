"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { clearDataAction } from "@/lib/actions/data-management";
import type { DataCategory, DataCategoryKey } from "@/lib/data/data-clear";

export function DangerZone({
  categories,
  counts,
}: {
  categories: DataCategory[];
  counts: Record<DataCategoryKey, number>;
}) {
  const [selected, setSelected] = useState<Set<DataCategoryKey>>(new Set());
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function toggle(key: DataCategoryKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDone(false);
  }

  const selectedCount = [...selected].reduce((sum, key) => sum + (counts[key] ?? 0), 0);
  const canDelete = selected.size > 0 && confirmText === "DELETE" && !isPending;

  function handleClear() {
    startTransition(async () => {
      await clearDataAction([...selected]);
      setSelected(new Set());
      setConfirmText("");
      setDone(true);
    });
  }

  return (
    <section className="mb-8 rounded-xl border border-loss/40 bg-loss-muted/30 p-5">
      <h2 className="mb-1 text-sm font-semibold text-loss">Danger Zone</h2>
      <p className="mb-4 text-xs text-muted">
        Permanently delete data you&apos;ve entered. This cannot be undone.
        Your configuration (API key, timezone, tag/entry-model/mistake lists,
        instrument configs, TradingView layouts, habit list) is never
        affected by this, no matter what you select below.
      </p>

      <div className="mb-4 flex flex-col gap-2">
        {categories.map((c) => (
          <label
            key={c.key}
            className={clsx(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
              selected.has(c.key)
                ? "border-loss/50 bg-loss-muted"
                : "border-border bg-surface hover:bg-surface-raised",
            )}
          >
            <input
              type="checkbox"
              checked={selected.has(c.key)}
              onChange={() => toggle(c.key)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{c.label}</span>
                <span className="text-xs text-muted">
                  {counts[c.key] ?? 0} record{(counts[c.key] ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">{c.description}</p>
            </div>
          </label>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="rounded-lg border border-loss/50 bg-surface p-4">
          <p className="mb-3 text-sm text-foreground">
            You&apos;re about to permanently delete{" "}
            <span className="font-semibold text-loss">
              {selectedCount} record{selectedCount === 1 ? "" : "s"}
            </span>{" "}
            across {selected.size} categor{selected.size === 1 ? "y" : "ies"}. Type{" "}
            <span className="font-mono font-semibold">DELETE</span> to confirm.
          </p>
          <div className="flex gap-2">
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-loss focus:outline-none"
            />
            <button
              type="button"
              disabled={!canDelete}
              onClick={handleClear}
              className="rounded-lg bg-loss px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Clear selected data"}
            </button>
          </div>
        </div>
      )}

      {done && (
        <p className="mt-3 text-sm font-medium text-profit">
          Deleted. Reload any open pages to see the change reflected.
        </p>
      )}
    </section>
  );
}

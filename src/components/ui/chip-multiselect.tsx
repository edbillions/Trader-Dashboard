"use client";

import { clsx } from "clsx";

export function ChipMultiSelect({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              className={clsx(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-accent bg-accent/20 text-foreground"
                  : "border-border bg-surface text-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
        {options.length === 0 && (
          <span className="text-xs text-muted">
            None configured yet — add some in Settings.
          </span>
        )}
      </div>
    </div>
  );
}

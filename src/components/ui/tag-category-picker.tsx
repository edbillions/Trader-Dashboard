"use client";

import { clsx } from "clsx";

interface TagOptionLike {
  id: string;
  label: string;
  sentiment: string;
}

interface TagCategoryLike {
  id: string;
  name: string;
  tags: TagOptionLike[];
}

// Renders one single-select chip group per category — at most one tag
// selected per category, shared across a single flat `selectedIds` array.
export function TagCategoryPicker({
  categories,
  selectedIds,
  onChange,
}: {
  categories: TagCategoryLike[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  if (categories.length === 0) return null;

  function selectInCategory(category: TagCategoryLike, tagId: string) {
    const categoryTagIds = category.tags.map((t) => t.id);
    const withoutThisCategory = selectedIds.filter(
      (id) => !categoryTagIds.includes(id),
    );
    if (selectedIds.includes(tagId)) {
      onChange(withoutThisCategory);
    } else {
      onChange([...withoutThisCategory, tagId]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.map((category) => (
        <div key={category.id} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">
            {category.name}
          </span>
          <div className="flex flex-wrap gap-2">
            {category.tags.map((tag) => {
              const active = selectedIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => selectInCategory(category, tag.id)}
                  className={clsx(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    !active &&
                      "border-border bg-surface text-muted hover:text-foreground",
                    active &&
                      tag.sentiment === "positive" &&
                      "border-profit bg-profit-muted text-profit",
                    active &&
                      tag.sentiment === "negative" &&
                      "border-loss bg-loss-muted text-loss",
                    active &&
                      tag.sentiment === "neutral" &&
                      "border-accent bg-accent/20 text-foreground",
                  )}
                >
                  {tag.label}
                </button>
              );
            })}
            {category.tags.length === 0 && (
              <span className="text-xs text-muted">
                No tags configured yet.
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

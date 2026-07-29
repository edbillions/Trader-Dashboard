"use client";

import { useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import { deleteChartImageAction } from "@/lib/actions/gallery";

interface ChartImage {
  id: string;
  filePath: string;
  title: string | null;
  symbol: string | null;
  grade: string | null;
  notes: string | null;
  createdAt: Date;
}

const GRADE_ORDER = ["A+", "A", "B", "C", "D", "F"] as const;

const GRADE_BADGE: Record<string, string> = {
  "A+": "bg-profit/20 text-profit",
  A: "bg-profit/20 text-profit",
  B: "bg-accent/20 text-accent",
  C: "bg-yellow-500/20 text-yellow-500",
  D: "bg-orange-500/20 text-orange-500",
  F: "bg-loss/20 text-loss",
};

export function ChartGallery({ images }: { images: ChartImage[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<ChartImage | null>(null);
  const [, startTransition] = useTransition();

  const gradeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const img of images) {
      const key = img.grade ?? "—";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [images]);

  const filtered = filter
    ? images.filter((img) => (img.grade ?? "—") === filter)
    : images;

  const availableGrades = GRADE_ORDER.filter((g) => gradeCounts.has(g));
  const hasUngraded = gradeCounts.has("—");

  function handleDelete(id: string) {
    if (!window.confirm("Delete this chart from the vault? This can't be undone.")) {
      return;
    }
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteChartImageAction(fd);
      setLightbox(null);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={clsx(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            filter === null
              ? "border-accent bg-accent/20 text-foreground"
              : "border-border bg-surface text-muted hover:text-foreground",
          )}
        >
          All ({images.length})
        </button>
        {availableGrades.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilter(g)}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === g
                ? "border-accent bg-accent/20 text-foreground"
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            {g} ({gradeCounts.get(g)})
          </button>
        ))}
        {hasUngraded && (
          <button
            type="button"
            onClick={() => setFilter("—")}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === "—"
                ? "border-accent bg-accent/20 text-foreground"
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            Ungraded ({gradeCounts.get("—")})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No charts here yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightbox(img)}
              className="group relative overflow-hidden rounded-lg border border-border bg-surface text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.filePath}
                alt={img.title ?? "Chart"}
                className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
              />
              {img.grade && (
                <span
                  className={clsx(
                    "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    GRADE_BADGE[img.grade] ?? "bg-surface-raised text-muted",
                  )}
                >
                  {img.grade}
                </span>
              )}
              {(img.title || img.symbol) && (
                <div className="p-2">
                  <p className="truncate text-xs font-medium text-foreground">
                    {img.symbol && (
                      <span className="text-accent">{img.symbol} · </span>
                    )}
                    {img.title}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setLightbox(null)}
        >
          <div
            className="flex max-h-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.filePath}
              alt={lightbox.title ?? "Chart"}
              className="max-h-[70vh] w-full object-contain bg-black"
            />
            <div className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {lightbox.symbol && (
                    <span className="text-accent">{lightbox.symbol} · </span>
                  )}
                  {lightbox.title ?? "Untitled"}
                  {lightbox.grade && (
                    <span
                      className={clsx(
                        "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        GRADE_BADGE[lightbox.grade] ??
                          "bg-surface-raised text-muted",
                      )}
                    >
                      {lightbox.grade}
                    </span>
                  )}
                </p>
                {lightbox.notes && (
                  <p className="mt-1 text-sm text-muted">{lightbox.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDelete(lightbox.id)}
                  className="text-xs font-medium text-loss hover:underline"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  className="text-xs font-medium text-muted hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

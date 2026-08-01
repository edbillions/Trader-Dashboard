"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Field, TextInput } from "@/components/ui/field";
import type { GradeCategory } from "@/lib/types/weekly-review";

const TONE_CLASSES: Record<"strong" | "neutral" | "weak", { text: string }> = {
  strong: { text: "text-profit" },
  neutral: { text: "text-accent" },
  weak: { text: "text-loss" },
};

export function GradeScaleSection({
  title,
  namePrefix,
  categories,
  defaultScores,
  aiSuggestion,
}: {
  title: string;
  namePrefix: string;
  categories: GradeCategory[];
  defaultScores: Record<string, number | null>;
  aiSuggestion?: { tone: "strong" | "neutral" | "weak"; assessment: string } | null;
}) {
  const [scores, setScores] = useState<Record<string, number | null>>(defaultScores);
  const maxTotal = categories.reduce((s, c) => s + c.max, 0);
  const total = categories.reduce((s, c) => {
    const v = scores[c.key];
    if (v == null) return s;
    return s + Math.min(Math.max(v, 0), c.max);
  }, 0);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs font-medium text-muted">
          {total} / {maxTotal}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.map((c) => (
          <Field key={c.key} label={`${c.label} (0-${c.max})`}>
            <TextInput
              name={`${namePrefix}.${c.key}`}
              type="number"
              min={0}
              max={c.max}
              step={1}
              value={scores[c.key] ?? ""}
              onChange={(e) =>
                setScores((prev) => ({
                  ...prev,
                  [c.key]: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </Field>
        ))}
      </div>
      {aiSuggestion && (
        <div className="mt-4 rounded-lg border border-border bg-surface-raised p-3">
          <p
            className={clsx(
              "mb-1 text-xs font-medium capitalize",
              TONE_CLASSES[aiSuggestion.tone].text,
            )}
          >
            AI suggestion — {aiSuggestion.tone}
          </p>
          <p className="text-xs text-muted">{aiSuggestion.assessment}</p>
        </div>
      )}
    </div>
  );
}

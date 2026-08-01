"use client";

import { useState } from "react";
import { Field, TextInput, Select } from "@/components/ui/field";
import { getPeriodRange, type PeriodType } from "@/lib/domain/period-review";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function PeriodTypeSelector({
  initialStart,
  initialEnd,
}: {
  initialStart?: string;
  initialEnd?: string;
}) {
  const [type, setType] = useState<PeriodType>(
    initialStart || initialEnd ? "custom" : "week",
  );
  // "Week" is the default type, but a user who never touches the dropdown
  // never fires handleTypeChange — so the initial start/end must already be
  // computed here, not left empty waiting for an onChange that may never
  // come.
  const [start, setStart] = useState(
    () => initialStart ?? toDateInputValue(getPeriodRange("week", new Date())!.start),
  );
  const [end, setEnd] = useState(
    () => initialEnd ?? toDateInputValue(getPeriodRange("week", new Date())!.end),
  );

  function handleTypeChange(next: PeriodType) {
    setType(next);
    if (next === "custom") return;
    const range = getPeriodRange(next, new Date());
    if (range) {
      setStart(toDateInputValue(range.start));
      setEnd(toDateInputValue(range.end));
    }
  }

  const readOnly = type !== "custom";

  return (
    <div className="grid grid-cols-3 gap-3">
      <Field label="Period type">
        <Select
          name="periodType"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as PeriodType)}
        >
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="quarter">Quarter</option>
          <option value="year">Year</option>
          <option value="custom">Custom</option>
        </Select>
      </Field>
      <Field label={readOnly ? "Period start (set by period type)" : "Period start"}>
        <TextInput
          name="periodStart"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "cursor-not-allowed bg-surface-raised text-muted" : undefined}
          required
        />
      </Field>
      <Field label={readOnly ? "Period end (set by period type)" : "Period end"}>
        <TextInput
          name="periodEnd"
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "cursor-not-allowed bg-surface-raised text-muted" : undefined}
          required
        />
      </Field>
    </div>
  );
}

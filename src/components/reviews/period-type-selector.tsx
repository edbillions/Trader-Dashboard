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
  const [start, setStart] = useState(initialStart ?? "");
  const [end, setEnd] = useState(initialEnd ?? "");

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
      <Field label="Period start">
        <TextInput
          name="periodStart"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "text-muted" : undefined}
          required
        />
      </Field>
      <Field label="Period end">
        <TextInput
          name="periodEnd"
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "text-muted" : undefined}
          required
        />
      </Field>
    </div>
  );
}

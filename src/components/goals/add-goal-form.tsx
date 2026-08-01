"use client";

import { useRef, useTransition } from "react";
import { Field, TextInput, TextArea, Select } from "@/components/ui/field";
import { createLifeGoalAction } from "@/lib/actions/goals-tracker";

export function AddGoalForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createLifeGoalAction(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Title">
          <TextInput name="title" required placeholder="Land 3 new clients" />
        </Field>
        <Field label="Category">
          <Select name="category" defaultValue="business">
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </Select>
        </Field>
      </div>
      <Field label="Tier (optional)">
        <Select name="tier" defaultValue="">
          <option value="">No tier</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </Select>
      </Field>
      <Field label="Description (optional)">
        <TextArea name="description" placeholder="Why this matters, how you'll get there..." />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Target value (optional)">
          <TextInput name="targetValue" type="number" step="any" placeholder="10" />
        </Field>
        <Field label="Unit (optional)">
          <TextInput name="unit" placeholder="clients, $, books..." />
        </Field>
        <Field label="Type">
          <Select name="direction" defaultValue="increase">
            <option value="increase">Build up to target</option>
            <option value="limit">Stay under a cap</option>
          </Select>
        </Field>
        <Field label="Target date (optional)">
          <TextInput name="targetDate" type="date" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isPrimary" value="true" />
        Make this my main focus
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add goal"}
      </button>
    </form>
  );
}

"use client";

import { useRef, useTransition } from "react";
import { Field, TextInput, TextArea, Select } from "@/components/ui/field";
import { addChartImageAction } from "@/lib/actions/gallery";

export function AddChartForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addChartImageAction(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label="Image" className="sm:col-span-2">
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
          />
        </Field>
        <Field label="Symbol">
          <TextInput name="symbol" placeholder="NQ" />
        </Field>
        <Field label="Grade">
          <Select name="grade" defaultValue="">
            <option value="">—</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Title (optional)">
          <TextInput name="title" placeholder="Bearish Unicorn, June 23" />
        </Field>
        <Field label="Notes (optional)">
          <TextInput name="notes" placeholder="What made this setup work..." />
        </Field>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Uploading..." : "Add to vault"}
      </button>
    </form>
  );
}

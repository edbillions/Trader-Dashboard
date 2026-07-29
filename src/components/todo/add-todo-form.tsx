"use client";

import { useRef, useTransition } from "react";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { createTodoAction } from "@/lib/actions/todos";

export function AddTodoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createTodoAction(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Title" className="sm:col-span-2">
          <TextInput name="title" required placeholder="Review Thursday's trades" />
        </Field>
        <Field label="Due date (optional)">
          <TextInput name="dueDate" type="date" />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <TextArea name="notes" placeholder="Any extra detail..." />
      </Field>
      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add to-do"}
      </button>
    </form>
  );
}

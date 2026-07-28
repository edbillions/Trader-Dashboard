"use client";

import { useId } from "react";
import { TextInput } from "./field";

export function DatalistInput({
  options,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { options: string[] }) {
  const id = useId();
  return (
    <>
      <TextInput {...props} list={id} />
      <datalist id={id}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

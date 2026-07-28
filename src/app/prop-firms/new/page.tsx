import { PageHeader } from "@/components/layout/page-header";
import { Field, TextInput, Select } from "@/components/ui/field";
import { createAccountAction } from "@/lib/actions/prop-firms";

export default function NewAccountPage() {
  return (
    <div>
      <PageHeader
        title="New prop firm account"
        description="Add an evaluation or funded account to track."
      />
      <form action={createAccountAction} className="flex max-w-md flex-col gap-4">
        <Field label="Firm name">
          <TextInput name="firmName" required placeholder="Topstep" />
        </Field>
        <Field label="Account name / label">
          <TextInput
            name="accountName"
            required
            placeholder="50K Eval #1"
          />
        </Field>
        <Field label="Account type">
          <Select name="accountType" required defaultValue="eval">
            <option value="eval">Evaluation</option>
            <option value="funded">Funded</option>
          </Select>
        </Field>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Create account
        </button>
      </form>
    </div>
  );
}

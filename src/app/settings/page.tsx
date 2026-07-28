import { PageHeader } from "@/components/layout/page-header";
import { Field, TextInput } from "@/components/ui/field";
import { LookupSection } from "@/components/settings/lookup-section";
import { getSettingsData } from "@/lib/data/settings";
import {
  clearApiKeyAction,
  createConfluenceFactorAction,
  createEntryModelAction,
  createInstrumentAction,
  createMistakeTypeAction,
  createRuleViolationAction,
  createTradeSessionAction,
  deleteInstrumentAction,
  toggleConfluenceFactorAction,
  toggleEntryModelAction,
  toggleMistakeTypeAction,
  toggleRuleViolationAction,
  toggleTradeSessionAction,
  updateSettingsAction,
} from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await getSettingsData();
  const hasApiKey = !!data.settings?.anthropicApiKey;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="API key, timezone, instrument tick values, and editable ICT tag lists."
      />

      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          General
        </h2>
        <form action={updateSettingsAction} className="flex flex-col gap-4">
          <Field label="Timezone">
            <TextInput
              name="timezone"
              defaultValue={data.settings?.timezone ?? "America/New_York"}
            />
          </Field>
          <Field label="Claude API key (for AI features)">
            <TextInput
              name="anthropicApiKey"
              type="password"
              placeholder={hasApiKey ? "•••••••••••••••• (set)" : "sk-ant-..."}
            />
          </Field>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Save
            </button>
            {hasApiKey && (
              <button
                formAction={clearApiKeyAction}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
              >
                Clear API key
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Instrument tick values
        </h2>
        <form
          action={createInstrumentAction}
          className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <Field label="Symbol">
            <TextInput name="symbol" required placeholder="ES" />
          </Field>
          <Field label="Tick value ($)">
            <TextInput name="tickValue" type="number" step="any" required />
          </Field>
          <Field label="Tick size">
            <TextInput name="tickSize" type="number" step="any" required />
          </Field>
          <Field label="Point value (optional)">
            <TextInput name="pointValue" type="number" step="any" />
          </Field>
          <button
            type="submit"
            className="col-span-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-raised sm:col-span-4"
          >
            Add / update instrument
          </button>
        </form>
        <div className="flex flex-col gap-1.5">
          {data.instruments.map((instrument) => (
            <div
              key={instrument.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-surface-raised"
            >
              <span className="text-foreground">
                {instrument.symbol} — tick {instrument.tickValue} / size{" "}
                {instrument.tickSize}
                {instrument.pointValue ? ` / pt ${instrument.pointValue}` : ""}
              </span>
              <form action={deleteInstrumentAction}>
                <input type="hidden" name="id" value={instrument.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-loss hover:underline"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LookupSection
          title="Entry models"
          items={data.entryModels}
          createAction={createEntryModelAction}
          toggleAction={toggleEntryModelAction}
        />
        <LookupSection
          title="Confluence factors"
          items={data.confluenceFactors}
          createAction={createConfluenceFactorAction}
          toggleAction={toggleConfluenceFactorAction}
        />
        <LookupSection
          title="Sessions / killzones"
          items={data.sessions}
          createAction={createTradeSessionAction}
          toggleAction={toggleTradeSessionAction}
        />
        <LookupSection
          title="Mistake types"
          items={data.mistakeTypes}
          createAction={createMistakeTypeAction}
          toggleAction={toggleMistakeTypeAction}
        />
        <LookupSection
          title="Rule-violation checklist"
          items={data.ruleViolations}
          createAction={createRuleViolationAction}
          toggleAction={toggleRuleViolationAction}
        />
      </div>
    </div>
  );
}

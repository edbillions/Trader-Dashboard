import { PageHeader } from "@/components/layout/page-header";
import { Field, TextInput, TextArea, Select } from "@/components/ui/field";
import { listTendencies } from "@/lib/data/tendencies";
import {
  createTendencyAction,
  deleteTendencyAction,
  updateTendencyStatusAction,
} from "@/lib/actions/tendencies";
import { TendencyScanner } from "@/components/tendencies/tendency-scanner";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  watching: "bg-accent/20 text-accent",
  resolved: "bg-profit-muted text-profit",
  eliminated: "bg-surface-raised text-muted",
};

export default async function TendenciesPage() {
  const tendencies = await listTendencies();

  return (
    <div>
      <PageHeader
        title="Tendencies"
        description="Behavioral patterns to watch across trades and months."
      />

      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Coach&apos;s note — how this page works
        </h2>
        <p className="text-sm text-muted">
          Tendencies are behavioral patterns to watch across trades and
          months — distinct from <span className="italic">Mistakes</span>{" "}
          (executed errors on specific trades) and setups you intentionally
          hunt for. Scan your recent trades below and Claude will cross-check
          them against this list, flagging any that show up, and surface new
          candidates if it spots a repeat pattern that isn&apos;t tracked
          yet.
        </p>
      </section>

      <TendencyScanner />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Add a tendency
        </h2>
        <form
          action={createTendencyAction}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <Field label="Title">
            <TextInput
              name="title"
              required
              placeholder="No Man's Land Sizing"
            />
          </Field>
          <Field label="Description">
            <TextArea
              name="description"
              placeholder="Describe the behavior, examples, and the lesson..."
            />
          </Field>
          <button
            type="submit"
            className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Add tendency
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Active tendencies — you populate, Claude watches
        </h2>
        {tendencies.length === 0 ? (
          <p className="text-sm text-muted">No tendencies tracked yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tendencies.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-accent">
                        {t.title}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[t.status] ?? STATUS_BADGE.watching}`}
                      >
                        {t.status}
                      </span>
                    </div>
                    {t.description && (
                      <p className="mt-1 text-sm text-muted">
                        {t.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-muted">
                      seen <span className="font-medium text-foreground">{t.seenCount}x</span>
                      {t.lastSeenAt &&
                        ` · last: ${t.lastSeenAt.toISOString().slice(0, 10)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form
                      action={updateTendencyStatusAction}
                      className="flex items-center gap-1"
                    >
                      <input type="hidden" name="id" value={t.id} />
                      <Select
                        name="status"
                        defaultValue={t.status}
                        className="!py-1 text-xs"
                      >
                        <option value="watching">Watching</option>
                        <option value="resolved">Resolved</option>
                        <option value="eliminated">Eliminated</option>
                      </Select>
                      <button
                        type="submit"
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Save
                      </button>
                    </form>
                    <form action={deleteTendencyAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-loss hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

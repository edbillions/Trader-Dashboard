import { Field, TextInput, Select } from "@/components/ui/field";
import {
  saveTradingViewLayoutAction,
  deleteTradingViewLayoutAction,
} from "@/lib/actions/settings";

interface TradingViewLayoutRow {
  id: string;
  instrument: string;
  timeframe: string;
  url: string;
}

const INSTRUMENTS = ["NQ", "ES"];
const TIMEFRAMES: { value: string; label: string }[] = [
  { value: "1h", label: "1 Hour" },
  { value: "15m", label: "15 Minute" },
  { value: "1m", label: "1 Minute" },
];

export function TradingViewLayoutsSection({
  layouts,
}: {
  layouts: TradingViewLayoutRow[];
}) {
  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-semibold text-foreground">
        TradingView chart layouts
      </h2>
      <p className="mb-4 text-xs text-muted">
        One saved layout URL per instrument/timeframe — the Pre-Market Analyst opens
        these and screenshots them each run. Before this works, run{" "}
        <code className="rounded bg-surface-raised px-1 py-0.5">
          npm run tradingview:login
        </code>{" "}
        once from the project directory to log into TradingView in a browser window
        that opens — the session is saved locally and reused for every future run, no
        credentials stored in the app.
      </p>

      <form
        action={saveTradingViewLayoutAction}
        className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <Field label="Instrument">
          <Select name="instrument" defaultValue="NQ">
            {INSTRUMENTS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Timeframe">
          <Select name="timeframe" defaultValue="1h">
            {TIMEFRAMES.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Layout URL" className="col-span-2 sm:col-span-2">
          <TextInput
            name="url"
            type="url"
            required
            placeholder="https://www.tradingview.com/chart/xxxxxxxx/"
          />
        </Field>
        <button
          type="submit"
          className="col-span-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-raised sm:col-span-4"
        >
          Save layout
        </button>
      </form>

      <div className="flex flex-col gap-1.5">
        {layouts.map((layout) => (
          <div
            key={layout.id}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-surface-raised"
          >
            <span className="text-foreground">
              <span className="font-medium">{layout.instrument}</span>{" "}
              <span className="text-muted">{layout.timeframe}</span>
              {" — "}
              <span className="truncate text-xs text-muted">{layout.url}</span>
            </span>
            <form action={deleteTradingViewLayoutAction}>
              <input type="hidden" name="id" value={layout.id} />
              <button
                type="submit"
                className="shrink-0 text-xs font-medium text-loss hover:underline"
              >
                Remove
              </button>
            </form>
          </div>
        ))}
        {layouts.length === 0 && (
          <p className="text-sm text-muted">
            No layouts saved yet — add one per instrument/timeframe above (6 total for
            NQ + ES).
          </p>
        )}
      </div>
    </section>
  );
}

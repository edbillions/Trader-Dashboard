import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getMissedTradesData } from "@/lib/data/missed-trades";
import { formatR } from "@/lib/pnl";
import { MissedRChart } from "@/components/missed-trades/missed-r-chart";
import { ReasonBarChart } from "@/components/missed-trades/reason-bar-chart";

export const dynamic = "force-dynamic";

export default async function MissedTradesPage() {
  const data = await getMissedTradesData();

  return (
    <div>
      <PageHeader
        title="Missed Trades"
        description="Setups you saw but didn't take — how much R is left on the table, and why."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total missed" value={data.totalMissed.toString()} />
        <Stat
          label="Total estimated R left on the table"
          value={formatR(data.totalEstimatedR)}
        />
        <Stat label="Avg estimated R" value={formatR(data.avgEstimatedR)} />
      </div>

      {data.sampleSizeWithEstimate === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Log an estimated R-multiple on your missed trades in the Journal
          wizard to unlock the charts below.
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Cumulative R left on the table
            </h3>
            <MissedRChart data={data.cumulativeSeries} />
          </section>
          <section className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Estimated R by reason missed
            </h3>
            <ReasonBarChart stats={data.byReason} />
          </section>
        </div>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          All missed trades
        </h3>
        {data.list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No missed trades logged yet. Add one during the Missed Trades
            step of the Journal wizard.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {data.list.map((m) => (
              <Link
                key={m.id}
                href={`/journal/${m.date}`}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm hover:bg-surface-raised"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">
                    {m.symbol}
                  </span>
                  <span className="text-xs text-muted">{m.date}</span>
                  {m.entryModel && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                      {m.entryModel}
                    </span>
                  )}
                  {m.reasonMissed && (
                    <span className="text-xs text-muted">{m.reasonMissed}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-muted">
                  {m.estimatedRMultiple != null
                    ? formatR(m.estimatedRMultiple)
                    : "no estimate"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

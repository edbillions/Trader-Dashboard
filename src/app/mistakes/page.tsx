import { PageHeader } from "@/components/layout/page-header";
import { getMistakesData } from "@/lib/data/mistakes";
import { formatCurrency } from "@/lib/pnl";
import { MistakeCoach } from "@/components/mistakes/mistake-coach";
import { MistakeFrequencyChart } from "@/components/mistakes/mistake-frequency-chart";
import { MistakeTrendChart } from "@/components/mistakes/mistake-trend-chart";

export const dynamic = "force-dynamic";

export default async function MistakesPage() {
  const data = await getMistakesData();
  const mistakeRate =
    data.totalTrades > 0
      ? (data.tradesWithMistakes / data.totalTrades) * 100
      : null;

  return (
    <div>
      <PageHeader
        title="Mistakes"
        description="Executed errors on specific trades — frequency, cost, and how to fix them."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total trades" value={data.totalTrades.toString()} />
        <Stat
          label="Trades with a mistake"
          value={data.tradesWithMistakes.toString()}
        />
        <Stat
          label="Mistake rate"
          value={mistakeRate != null ? `${mistakeRate.toFixed(1)}%` : "—"}
        />
        <Stat
          label="Cost of mistake trades"
          value={formatCurrency(data.mistakeCostTotal)}
          positive={data.mistakeCostTotal >= 0}
        />
      </div>

      <MistakeCoach />

      {data.byMistake.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No mistakes tagged on any trades yet. Tag mistakes on a trade in the
          Journal wizard to start tracking them here.
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Frequency by mistake
              </h2>
              <MistakeFrequencyChart stats={data.byMistake} />
            </section>
            <section className="rounded-xl border border-border bg-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Mistake-tagged trades per month
              </h2>
              {data.trend.length === 0 ? (
                <p className="text-sm text-muted">Not enough data yet.</p>
              ) : (
                <MistakeTrendChart trend={data.trend} />
              )}
            </section>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              By mistake
            </h2>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">Mistake</th>
                    <th className="px-4 py-3">Trades</th>
                    <th className="px-4 py-3">Win rate</th>
                    <th className="px-4 py-3">Net P&L</th>
                    <th className="px-4 py-3">Avg R</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byMistake.map((m) => (
                    <tr key={m.label} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {m.label}
                      </td>
                      <td className="px-4 py-3 text-muted">{m.count}</td>
                      <td className="px-4 py-3 text-muted">
                        {m.winRate != null ? `${m.winRate.toFixed(0)}%` : "—"}
                      </td>
                      <td
                        className={
                          m.netPnl >= 0
                            ? "px-4 py-3 font-medium text-profit"
                            : "px-4 py-3 font-medium text-loss"
                        }
                      >
                        {formatCurrency(m.netPnl)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {m.avgR != null ? m.avgR.toFixed(2) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={
          positive === undefined
            ? "mt-1 text-xl font-semibold text-foreground"
            : positive
              ? "mt-1 text-xl font-semibold text-profit"
              : "mt-1 text-xl font-semibold text-loss"
        }
      >
        {value}
      </p>
    </div>
  );
}

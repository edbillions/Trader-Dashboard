import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getTradingDayDetail } from "@/lib/data/trading-day";
import { formatCurrency, formatR } from "@/lib/pnl";

export default async function JournalDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const day = await getTradingDayDetail(date);

  if (!day) notFound();

  const netPnl = day.trades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);

  return (
    <div>
      <PageHeader
        title={date}
        description={`${day.trades.length} trade${day.trades.length === 1 ? "" : "s"} · Net P&L ${formatCurrency(netPnl)}`}
        actions={
          <Link
            href={`/journal/new?date=${date}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
          >
            Edit
          </Link>
        }
      />

      {day.aiSummary && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            AI summary
          </p>
          <p className="mt-1 text-sm text-foreground">{day.aiSummary}</p>
        </div>
      )}

      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Pre-market plan
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Info label="HTF bias" value={day.htfBias} />
          <Info label="Key levels" value={day.keyLevels} />
          <Info label="Session timing" value={day.sessionTiming} />
          <Info label="News" value={day.news} />
          <Info
            label="Max loss plan"
            value={day.maxLossPlan != null ? formatCurrency(day.maxLossPlan) : null}
          />
          <Info label="Position size plan" value={day.positionSizePlan} />
          <Info
            label="Max trade count"
            value={day.maxTradeCountPlan?.toString() ?? null}
          />
        </dl>
        {day.planScreenshots.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {day.planScreenshots.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s.id}
                src={s.filePath}
                alt="Pre-market plan screenshot"
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Trades</h2>
        {day.trades.length === 0 ? (
          <p className="text-sm text-muted">No trades logged.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {day.trades.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {t.symbol} · {t.direction.toUpperCase()}
                    {t.entryModel ? ` · ${t.entryModel}` : ""}
                    {t.setupGrade ? ` · Grade ${t.setupGrade}` : ""}
                  </span>
                  <span
                    className={
                      (t.netPnl ?? 0) >= 0
                        ? "font-semibold text-profit"
                        : "font-semibold text-loss"
                    }
                  >
                    {formatCurrency(t.netPnl)} ({formatR(t.rMultiple)})
                  </span>
                </div>
                {(t.confluenceFactors.length > 0 || t.mistakes.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.confluenceFactors.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted"
                      >
                        {c.label}
                      </span>
                    ))}
                    {t.mistakes.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-full bg-loss-muted px-2 py-0.5 text-xs text-loss"
                      >
                        {m.label}
                      </span>
                    ))}
                  </div>
                )}
                {t.writeup && (
                  <p className="mt-2 text-sm text-muted">{t.writeup}</p>
                )}
                {t.screenshots.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {t.screenshots.map((s) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={s.id}
                        src={s.filePath}
                        alt="Trade screenshot"
                        className="h-20 w-20 rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Missed trades
        </h2>
        {day.missedTrades.length === 0 ? (
          <p className="text-sm text-muted">None logged.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {day.missedTrades.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <span className="font-medium text-foreground">
                  {m.symbol}
                  {m.entryModel ? ` · ${m.entryModel}` : ""}
                </span>
                {m.setupDescription && (
                  <p className="mt-1 text-sm text-muted">
                    {m.setupDescription}
                  </p>
                )}
                {m.reasonMissed && (
                  <p className="mt-1 text-sm text-loss">{m.reasonMissed}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Post-session review
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Info label="Plan adherence grade" value={day.planAdherenceGrade} />
          <Info label="Psychology log" value={day.psychologyLog} />
          <Info label="Notes" value={day.freeformNotes} />
        </dl>
        {day.ruleViolations.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-medium text-muted">
              Rule violations
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {day.ruleViolations.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full bg-loss-muted px-2 py-0.5 text-xs text-loss"
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value || "—"}</dd>
    </div>
  );
}

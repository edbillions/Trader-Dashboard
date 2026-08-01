import Link from "next/link";
import { clsx } from "clsx";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getTradeDetail } from "@/lib/data/trades";
import { formatCurrency, formatR } from "@/lib/pnl";
import { SmartReviewPanel } from "@/components/trades/smart-review-panel";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = await getTradeDetail(id);

  if (!trade) notFound();

  const date = dateKey(trade.tradingDay.date);
  const durationMinutes = trade.exitTime
    ? Math.round(
        (trade.exitTime.getTime() - trade.entryTime.getTime()) / 60000,
      )
    : null;

  return (
    <div>
      <PageHeader
        title={`${trade.symbol} · ${trade.direction.toUpperCase()}`}
        description={date}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/journal/new?date=${date}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
            >
              Edit
            </Link>
            <Link
              href={`/journal/${date}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
            >
              View journal day
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label="Net P&L"
              value={formatCurrency(trade.netPnl)}
              positive={trade.netPnl != null ? trade.netPnl >= 0 : undefined}
            />
            <Stat
              label="Gross P&L"
              value={formatCurrency(trade.grossPnl)}
              positive={trade.grossPnl != null ? trade.grossPnl >= 0 : undefined}
            />
            <Stat
              label="R-multiple"
              value={formatR(trade.rMultiple)}
              positive={trade.rMultiple != null ? trade.rMultiple >= 0 : undefined}
            />
            <Stat
              label="Duration"
              value={durationMinutes != null ? `${durationMinutes} min` : "—"}
            />
          </div>

          <section className="mb-6 rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Trade details
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Info label="Entry price" value={trade.entryPrice.toString()} />
              <Info label="Exit price" value={trade.exitPrice?.toString() ?? null} />
              <Info label="Position size" value={`${trade.positionSize} contracts`} />
              <Info label="Stop (planned)" value={trade.stopLossPlanned?.toString() ?? null} />
              <Info label="Stop (actual)" value={trade.stopLossActual?.toString() ?? null} />
              <Info label="Target (planned)" value={trade.targetPlanned?.toString() ?? null} />
              <Info label="Target (actual)" value={trade.targetActual?.toString() ?? null} />
              <Info label="Commission" value={trade.commission != null ? formatCurrency(trade.commission) : null} />
              <Info label="Account" value={trade.account ? `${trade.account.firmName} · ${trade.account.accountName}` : null} />
              <Info label="Entry timeframe" value={trade.entryTimeframe} />
              <LinkInfo label="HTF chart" href={trade.htfChartLink} />
              <LinkInfo label="Intermediate chart" href={trade.intermediateChartLink} />
              <LinkInfo label="Entry chart" href={trade.entryChartLink} />
              <Info label="Entry model" value={trade.entryModel} />
              <Info label="Session" value={trade.session} />
              <Info label="Setup grade" value={trade.setupGrade} />
              <Info label="Daily bias" value={trade.dailyBias} />
              <Info label="HTF POI" value={trade.htfPoi} />
              <Info label="HTF DOL" value={trade.htfDol} />
              <Info label="Max favorable excursion" value={trade.mfeR != null ? formatR(trade.mfeR) : null} />
              <Info label="Max adverse excursion" value={trade.maeR != null ? `${trade.maeR.toFixed(2)}R` : null} />
            </dl>
          </section>

          {(trade.confluenceFactors.length > 0 || trade.mistakes.length > 0) && (
            <section className="mb-6 flex flex-col gap-4">
              {trade.confluenceFactors.length > 0 && (
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-foreground">
                    Confluence factors
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {trade.confluenceFactors.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {trade.mistakes.length > 0 && (
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-foreground">
                    Mistakes
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {trade.mistakes.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-full border border-loss/30 bg-loss-muted px-2.5 py-1 text-xs font-medium text-loss"
                      >
                        {m.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {trade.writeup && (
            <section className="mb-6 rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                Writeup
              </h2>
              <p className="text-sm text-muted">{trade.writeup}</p>
            </section>
          )}

          {trade.screenshots.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Screenshots
              </h2>
              <div className="flex flex-wrap gap-4">
                {trade.screenshots.map((s) => (
                  <a
                    key={s.id}
                    href={s.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-xl border border-border bg-surface-raised transition-colors hover:border-accent/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.filePath}
                      alt="Trade screenshot"
                      className="h-auto max-h-[600px] w-full max-w-3xl object-contain"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SmartReviewPanel trade={trade} />
        </aside>
      </div>
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
    <div
      className={clsx(
        "rounded-xl border-2 p-4 transition-colors",
        positive === undefined
          ? "border-accent/30 bg-accent/5"
          : positive
            ? "border-profit/40 bg-profit-muted"
            : "border-loss/40 bg-loss-muted",
      )}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={clsx(
          "mt-1 text-2xl font-bold tracking-tight",
          positive === undefined
            ? "text-accent"
            : positive
              ? "text-profit"
              : "text-loss",
        )}
      >
        {value}
      </p>
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

function LinkInfo({ label, href }: { label: string; href: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-foreground">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            View chart →
          </a>
        ) : (
          "—"
        )}
      </dd>
    </div>
  );
}

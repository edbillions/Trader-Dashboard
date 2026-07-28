import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getTradeDetail } from "@/lib/data/trades";
import { formatCurrency, formatR } from "@/lib/pnl";

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
          <Link
            href={`/journal/${date}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
          >
            View journal day
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Net P&L" value={formatCurrency(trade.netPnl)} accent />
        <Stat label="Gross P&L" value={formatCurrency(trade.grossPnl)} />
        <Stat label="R-multiple" value={formatR(trade.rMultiple)} />
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
          <Info label="HTF timeframe" value={trade.htfTimeframe} />
          <Info label="Intermediate timeframe" value={trade.intermediateTimeframe} />
          <Info label="Entry timeframe" value={trade.entryTimeframe} />
          <Info label="Entry model" value={trade.entryModel} />
          <Info label="Session" value={trade.session} />
          <Info label="Setup grade" value={trade.setupGrade} />
          <Info label="Daily bias" value={trade.dailyBias} />
          <Info label="HTF POI" value={trade.htfPoi} />
          <Info label="HTF DOL" value={trade.htfDol} />
        </dl>
      </section>

      {(trade.confluenceFactors.length > 0 || trade.mistakes.length > 0) && (
        <section className="mb-6 flex flex-wrap gap-1.5">
          {trade.confluenceFactors.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-surface-raised px-2 py-1 text-xs text-muted"
            >
              {c.label}
            </span>
          ))}
          {trade.mistakes.map((m) => (
            <span
              key={m.id}
              className="rounded-full bg-loss-muted px-2 py-1 text-xs text-loss"
            >
              {m.label}
            </span>
          ))}
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
        <section className="flex flex-wrap gap-3">
          {trade.screenshots.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.id}
              src={s.filePath}
              alt="Trade screenshot"
              className="h-40 w-40 rounded-lg border border-border object-cover"
            />
          ))}
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={
          accent
            ? "mt-1 text-lg font-semibold text-foreground"
            : "mt-1 text-lg font-semibold text-foreground"
        }
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

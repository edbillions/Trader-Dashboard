import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatCurrency } from "@/lib/pnl";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your trading day, at a glance."
      />

      {!data.hasLoggedToday && (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Today&apos;s entry is incomplete
            </p>
            <p className="text-sm text-muted">
              You haven&apos;t logged {data.today} yet.
            </p>
          </div>
          <Link
            href="/journal/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Log today
          </Link>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Total trades" value={data.totalTrades.toString()} />
        <Stat
          label="Net P&L (all-time)"
          value={formatCurrency(data.netPnl)}
          positive={data.netPnl >= 0}
        />
        <Stat
          label="Win rate"
          value={data.winRate != null ? `${data.winRate.toFixed(1)}%` : "—"}
        />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Recent days
        </h2>
        {data.recentDays.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Nothing logged yet.{" "}
            <Link href="/journal/new" className="text-accent hover:underline">
              Log your first day
            </Link>
            .
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.recentDays.map((day) => (
              <Link
                key={day.date}
                href={`/journal/${day.date}`}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm hover:bg-surface-raised"
              >
                <span className="text-foreground">{day.date}</span>
                <span className="text-muted">{day.tradeCount} trades</span>
                <span
                  className={
                    day.netPnl >= 0
                      ? "font-medium text-profit"
                      : "font-medium text-loss"
                  }
                >
                  {formatCurrency(day.netPnl)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
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

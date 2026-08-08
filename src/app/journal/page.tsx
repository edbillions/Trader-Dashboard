import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { listTradingDays } from "@/lib/data/trading-day";
import { formatCurrency } from "@/lib/pnl";
import { DaySparkline } from "@/components/journal/day-sparkline";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const days = await listTradingDays();

  return (
    <div>
      <PageHeader
        title="Journal"
        description="Every logged trading day, most recent first."
        actions={
          <Link
            href="/journal/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Log a day
          </Link>
        }
      />

      {days.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No journal entries yet.{" "}
          <Link href="/journal/new" className="text-accent hover:underline">
            Log your first day
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Trades</th>
                <th className="px-4 py-3">Net P&L</th>
                <th className="px-4 py-3">Plan adherence</th>
                <th className="px-4 py-3">Recap</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr
                  key={day.id}
                  className="border-t border-border hover:bg-surface"
                >
                  <td className="min-w-[240px] px-4 py-3">
                    <div className="flex items-center">
                      <Link
                        href={`/journal/${day.date}`}
                        className="font-medium text-foreground hover:text-accent"
                      >
                        {format(new Date(`${day.date}T00:00:00`), "EEEE, MMM d, yyyy")}
                      </Link>
                      <div className="flex flex-1 justify-center">
                        <DaySparkline series={day.series} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{day.tradeCount}</td>
                  <td
                    className={
                      day.netPnl >= 0
                        ? "px-4 py-3 font-medium text-profit"
                        : "px-4 py-3 font-medium text-loss"
                    }
                  >
                    {formatCurrency(day.netPnl)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {day.planAdherenceGrade ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {day.hasRecap ? (
                      <Link
                        href={`/live-session/recap/${day.date}`}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        View recap →
                      </Link>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

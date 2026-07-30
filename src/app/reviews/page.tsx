import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getReviewsData } from "@/lib/data/reviews";
import { formatCurrency, formatR } from "@/lib/pnl";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReviewsPage() {
  const reviews = await getReviewsData();

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Weekly, monthly, quarterly, and yearly reviews of your trading."
      />

      <div className="mb-6">
        <Link
          href="/reviews/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          New review
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No reviews yet. A weekly review auto-drafts once a completed week
          has trades, or start one yourself above.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Trades</th>
                <th className="px-4 py-3">Win rate</th>
                <th className="px-4 py-3">Net</th>
                <th className="px-4 py-3">Tilt</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/reviews/${r.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {r.title}
                    </Link>
                    {r.isDraft && (
                      <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                        Draft — needs your review
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {fmtDate(r.periodStart)} → {fmtDate(r.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {r.rating != null ? "★".repeat(r.rating) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {r.stats.tradeCount} ({r.stats.winners}W / {r.stats.losers}L)
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {r.stats.winRate != null ? `${r.stats.winRate.toFixed(0)}%` : "—"}
                  </td>
                  <td
                    className={
                      r.stats.netPnl >= 0
                        ? "px-4 py-3 font-medium text-profit"
                        : "px-4 py-3 font-medium text-loss"
                    }
                  >
                    {formatCurrency(r.stats.netPnl)} · {formatR(r.stats.netR)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className={
                          r.tiltmeter.pct >= 100 ? "h-full bg-loss" : "h-full bg-accent"
                        }
                        style={{ width: `${r.tiltmeter.pct}%` }}
                      />
                    </div>
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

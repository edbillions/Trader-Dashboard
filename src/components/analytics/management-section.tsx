import type { ManagementStats } from "@/lib/domain/trade-management";
import { ManagementChart } from "@/components/analytics/management-chart";

export function ManagementSection({
  management,
}: {
  management: ManagementStats;
}) {
  if (management.sampleSize === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        Log MFE/MAE plus a planned stop and target on your trades to see how
        much your in-trade management is adding or costing you.
      </div>
    );
  }

  const impact = management.managementImpactPct;

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-muted">Management impact</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              impact == null
                ? "text-foreground"
                : impact >= 0
                  ? "text-profit"
                  : "text-loss"
            }`}
          >
            {impact != null ? `${impact >= 0 ? "+" : ""}${impact.toFixed(0)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Hurt by management</p>
          <p className="mt-1 text-xl font-semibold text-loss">
            {management.hurtByManagementCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Improved by management</p>
          <p className="mt-1 text-xl font-semibold text-profit">
            {management.improvedByManagementCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Stuck to plan</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {management.asPlannedCount}
          </p>
        </div>
      </div>

      <ManagementChart data={management.cumulativeSeries} />

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-xs text-muted">
        <span>Hit target: {management.hitTpCount}</span>
        <span>Hit stop: {management.hitSlCount}</span>
        <span>Neither: {management.neitherCount}</span>
        <span>Exited early despite reaching target: {management.exitedBeforeTpCount}</span>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        &quot;Potential R&quot; is a hypothetical outcome reconstructed from
        MFE/MAE vs. your planned stop and target — an approximation, since
        those are two price extremes, not the full intra-trade path.
        Based on {management.sampleSize} trade
        {management.sampleSize === 1 ? "" : "s"} with a usable hypothetical
        outcome.
      </p>
    </div>
  );
}

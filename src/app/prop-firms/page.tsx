import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { listAccountsWithRollup } from "@/lib/data/prop-firms";
import { deleteAccountAction } from "@/lib/actions/prop-firms";
import { formatCurrency } from "@/lib/pnl";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { AccountComparisonChart } from "@/components/prop-firms/account-comparison-chart";

export const dynamic = "force-dynamic";

export default async function PropFirmsPage() {
  const accounts = await listAccountsWithRollup();

  const totalNet = accounts.reduce(
    (sum, a) => sum + a.netPnl + a.tradingPnl,
    0,
  );

  return (
    <div>
      <PageHeader
        title="Prop Firms"
        description="Accounts, fees, payouts, and true net profitability."
        actions={
          <Link
            href="/prop-firms/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            New account
          </Link>
        }
      />

      <div className="mb-8 rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-medium text-muted">
          Total across all accounts (trading P&L + payouts − fees)
        </p>
        <p
          className={
            totalNet >= 0
              ? "mt-1 text-2xl font-semibold text-profit"
              : "mt-1 text-2xl font-semibold text-loss"
          }
        >
          {formatCurrency(totalNet)}
        </p>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No accounts yet.{" "}
          <Link href="/prop-firms/new" className="text-accent hover:underline">
            Add your first account
          </Link>
          .
        </div>
      ) : (
        <>
          {accounts.length > 1 && (
            <section className="mb-8 rounded-xl border border-border bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Account comparison
              </h3>
              <AccountComparisonChart
                stats={accounts.map((a) => ({
                  label: `${a.firmName} · ${a.accountName}`,
                  netPnl: a.netPnl + a.tradingPnl,
                  tradeCount: a.tradeCount,
                  winRate: a.winRate,
                }))}
              />
            </section>
          )}
        <div className="flex flex-col gap-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 hover:bg-surface-raised"
            >
              <Link
                href={`/prop-firms/${account.id}`}
                className="flex-1"
              >
                <p className="font-medium text-foreground">
                  {account.firmName} · {account.accountName}
                </p>
                <p className="text-xs text-muted">
                  {account.accountType} · {account.status} ·{" "}
                  {account.tradeCount} trades
                </p>
              </Link>
              <div className="flex items-center gap-4">
                <Link href={`/prop-firms/${account.id}`} className="text-right">
                  <p className="text-xs text-muted">
                    Trading P&L {formatCurrency(account.tradingPnl)}
                  </p>
                  <p
                    className={
                      account.netPnl + account.tradingPnl >= 0
                        ? "font-semibold text-profit"
                        : "font-semibold text-loss"
                    }
                  >
                    {formatCurrency(account.netPnl + account.tradingPnl)} net
                  </p>
                </Link>
                <form action={deleteAccountAction}>
                  <input type="hidden" name="id" value={account.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`Delete ${account.firmName} · ${account.accountName}? This removes its fees and payouts too, and unlinks any trades from it. This can't be undone.`}
                    className="shrink-0 text-xs font-medium text-loss hover:underline"
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}

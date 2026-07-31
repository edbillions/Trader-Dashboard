import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Field, TextInput, Select } from "@/components/ui/field";
import { getAccountDetail } from "@/lib/data/prop-firms";
import { formatCurrency, formatR } from "@/lib/pnl";
import {
  addExpenseAction,
  addPayoutAction,
  deleteAccountAction,
  deleteExpenseAction,
  deletePayoutAction,
  updateAccountLimitsAction,
  updateAccountStatusAction,
} from "@/lib/actions/prop-firms";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { DrawdownCard } from "@/components/prop-firms/drawdown-card";
import { ACCOUNT_TYPE_LABELS } from "@/lib/domain/account-type";

export const dynamic = "force-dynamic";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getAccountDetail(id);
  if (!account) notFound();

  const totalExpenses = account.expenses.reduce((s, e) => s + e.amount, 0);
  const totalPayouts = account.payouts.reduce((s, p) => s + p.amount, 0);
  const tradingPnl = account.trades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const netPnl = totalPayouts - totalExpenses + tradingPnl;

  const todayKey = dateKey(new Date());
  const todayNetPnl = account.trades
    .filter((t) => dateKey(t.tradingDay.date) === todayKey)
    .reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const todayLoss = todayNetPnl < 0 ? Math.abs(todayNetPnl) : 0;

  return (
    <div>
      <PageHeader
        title={`${account.firmName} · ${account.accountName}`}
        description={`${ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType} account`}
        actions={
          <div className="flex items-center gap-2">
            <form action={updateAccountStatusAction} className="flex gap-2">
              <input type="hidden" name="accountId" value={account.id} />
              <Select name="status" defaultValue={account.status}>
                <option value="active">Active</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="closed">Closed</option>
              </Select>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
              >
                Update status
              </button>
            </form>
            <form action={deleteAccountAction}>
              <input type="hidden" name="id" value={account.id} />
              <input type="hidden" name="redirect" value="true" />
              <ConfirmSubmitButton
                confirmMessage={`Delete ${account.firmName} · ${account.accountName}? This removes its fees and payouts too, and unlinks any trades from it. This can't be undone.`}
                className="rounded-lg border border-loss/40 px-3 py-2 text-sm font-medium text-loss hover:bg-loss-muted"
              >
                Delete account
              </ConfirmSubmitButton>
            </form>
          </div>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Trading P&L" value={formatCurrency(tradingPnl)} />
        <Stat label="Total fees" value={formatCurrency(totalExpenses)} negative />
        <Stat label="Total payouts" value={formatCurrency(totalPayouts)} />
        <Stat label="Net" value={formatCurrency(netPnl)} accent={netPnl >= 0} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DrawdownCard
          startingBalance={account.startingBalance}
          maxDrawdownLimit={account.maxDrawdownLimit}
          dailyLossLimit={account.dailyLossLimit}
          drawdown={account.drawdown}
          todayLoss={todayLoss}
        />

        <form
          action={updateAccountLimitsAction}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <h3 className="text-sm font-semibold text-foreground">
            Account limits
          </h3>
          <input type="hidden" name="accountId" value={account.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Starting balance">
              <TextInput
                name="startingBalance"
                type="number"
                step="any"
                defaultValue={account.startingBalance ?? ""}
                placeholder="50000"
              />
            </Field>
            <Field label="Max drawdown limit ($)">
              <TextInput
                name="maxDrawdownLimit"
                type="number"
                step="any"
                defaultValue={account.maxDrawdownLimit ?? ""}
                placeholder="2000"
              />
            </Field>
            <Field label="Daily loss limit ($)">
              <TextInput
                name="dailyLossLimit"
                type="number"
                step="any"
                defaultValue={account.dailyLossLimit ?? ""}
                placeholder="1000"
              />
            </Field>
          </div>
          <button
            type="submit"
            className="mt-1 self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Save limits
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Fees & expenses
          </h2>
          <form
            action={addExpenseAction}
            className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <input type="hidden" name="accountId" value={account.id} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kind">
                <Select name="kind" defaultValue="evaluation_fee">
                  <option value="evaluation_fee">Evaluation fee</option>
                  <option value="recurring_fee">Recurring fee</option>
                </Select>
              </Field>
              <Field label="Amount">
                <TextInput name="amount" type="number" step="any" required />
              </Field>
            </div>
            <Field label="Date">
              <TextInput name="date" type="date" required />
            </Field>
            <Field label="Note">
              <TextInput name="note" placeholder="Optional" />
            </Field>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Add expense
            </button>
          </form>
          <div className="flex flex-col gap-2">
            {account.expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {formatCurrency(expense.amount)}
                  </span>{" "}
                  <span className="text-muted">
                    {expense.kind.replace("_", " ")} ·{" "}
                    {dateKey(expense.date)}
                  </span>
                </div>
                <form action={deleteExpenseAction}>
                  <input type="hidden" name="id" value={expense.id} />
                  <input
                    type="hidden"
                    name="accountId"
                    value={account.id}
                  />
                  <button
                    type="submit"
                    className="text-xs font-medium text-loss hover:underline"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Payouts
          </h2>
          <form
            action={addPayoutAction}
            className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <input type="hidden" name="accountId" value={account.id} />
            <Field label="Amount">
              <TextInput name="amount" type="number" step="any" required />
            </Field>
            <Field label="Date">
              <TextInput name="date" type="date" required />
            </Field>
            <Field label="Note">
              <TextInput name="note" placeholder="Optional" />
            </Field>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Add payout
            </button>
          </form>
          <div className="flex flex-col gap-2">
            {account.payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-profit">
                    {formatCurrency(payout.amount)}
                  </span>{" "}
                  <span className="text-muted">{dateKey(payout.date)}</span>
                </div>
                <form action={deletePayoutAction}>
                  <input type="hidden" name="id" value={payout.id} />
                  <input
                    type="hidden"
                    name="accountId"
                    value={account.id}
                  />
                  <button
                    type="submit"
                    className="text-xs font-medium text-loss hover:underline"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Trades on this account
        </h2>
        {account.trades.length === 0 ? (
          <p className="text-sm text-muted">No trades linked yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Net P&L</th>
                  <th className="px-4 py-3">R</th>
                </tr>
              </thead>
              <tbody>
                {account.trades.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        href={`/trades/${t.id}`}
                        className="text-foreground hover:text-accent"
                      >
                        {dateKey(t.tradingDay.date)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">{t.symbol}</td>
                    <td
                      className={
                        (t.netPnl ?? 0) >= 0
                          ? "px-4 py-3 font-medium text-profit"
                          : "px-4 py-3 font-medium text-loss"
                      }
                    >
                      {formatCurrency(t.netPnl)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatR(t.rMultiple)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  negative,
  accent,
}: {
  label: string;
  value: string;
  negative?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={
          accent === true
            ? "mt-1 text-lg font-semibold text-profit"
            : accent === false
              ? "mt-1 text-lg font-semibold text-loss"
              : negative
                ? "mt-1 text-lg font-semibold text-loss"
                : "mt-1 text-lg font-semibold text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}

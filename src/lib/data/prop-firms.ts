import { prisma } from "@/lib/prisma";
import { computeDrawdown } from "@/lib/domain/drawdown";

export async function listAccountsWithRollup() {
  const accounts = await prisma.propFirmAccount.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      expenses: true,
      payouts: true,
      trades: { select: { netPnl: true } },
    },
  });

  return accounts.map((account) => {
    const totalExpenses = account.expenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );
    const totalPayouts = account.payouts.reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    const tradingPnl = account.trades.reduce(
      (sum, t) => sum + (t.netPnl ?? 0),
      0,
    );
    const wins = account.trades.filter((t) => (t.netPnl ?? 0) > 0).length;
    const losses = account.trades.filter((t) => (t.netPnl ?? 0) < 0).length;

    return {
      id: account.id,
      firmName: account.firmName,
      accountName: account.accountName,
      accountType: account.accountType,
      status: account.status,
      tradeCount: account.trades.length,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : null,
      totalExpenses,
      totalPayouts,
      tradingPnl,
      netPnl: totalPayouts - totalExpenses,
    };
  });
}

export async function getAccountDetail(id: string) {
  const account = await prisma.propFirmAccount.findUnique({
    where: { id },
    include: {
      expenses: { orderBy: { date: "desc" } },
      payouts: { orderBy: { date: "desc" } },
      trades: {
        orderBy: { entryTime: "desc" },
        include: { tradingDay: { select: { date: true } } },
      },
    },
  });

  if (!account) return null;

  const chronologicalPnls = [...account.trades]
    .reverse()
    .map((t) => t.netPnl ?? 0);
  const drawdown =
    account.startingBalance != null
      ? computeDrawdown(account.startingBalance, chronologicalPnls)
      : null;

  return { ...account, drawdown };
}

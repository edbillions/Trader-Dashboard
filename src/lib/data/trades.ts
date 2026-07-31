import { prisma } from "@/lib/prisma";

export interface TradesFilter {
  accountId?: string;
  start?: string; // yyyy-mm-dd
  end?: string; // yyyy-mm-dd
}

export async function listTrades(filter: TradesFilter = {}) {
  return prisma.trade.findMany({
    where: {
      accountId: filter.accountId || undefined,
      entryTime: {
        gte: filter.start ? new Date(`${filter.start}T00:00:00`) : undefined,
        lte: filter.end ? new Date(`${filter.end}T23:59:59.999`) : undefined,
      },
    },
    orderBy: { entryTime: "desc" },
    include: {
      tradingDay: { select: { date: true } },
      account: { select: { firmName: true, accountName: true } },
    },
  });
}

// Every account regardless of status — a since-closed account can still have
// historical trades worth filtering by, unlike the Journal wizard's account
// picker which intentionally only offers active ones for new trades.
export async function listAccountsForFilter() {
  return prisma.propFirmAccount.findMany({
    select: { id: true, firmName: true, accountName: true },
    orderBy: { firmName: "asc" },
  });
}

export async function getTradeDetail(id: string) {
  return prisma.trade.findUnique({
    where: { id },
    include: {
      tradingDay: { select: { date: true } },
      account: { select: { firmName: true, accountName: true } },
      confluenceFactors: true,
      mistakes: true,
      screenshots: true,
    },
  });
}

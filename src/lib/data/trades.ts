import { prisma } from "@/lib/prisma";

export async function listTrades() {
  return prisma.trade.findMany({
    orderBy: { entryTime: "desc" },
    include: {
      tradingDay: { select: { date: true } },
      account: { select: { firmName: true, accountName: true } },
    },
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

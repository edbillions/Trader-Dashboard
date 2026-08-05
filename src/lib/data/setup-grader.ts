import { prisma } from "@/lib/prisma";

// Setup Grader session data: today's bias pick + running notes log.
// Plain read-only lookup — merely opening the page must never create a
// TradingDay row; that only happens the moment a note is added or a bias
// is picked (see src/lib/actions/setup-grader.ts).
export async function getSetupGraderSessionData(dateKey: string) {
  const dateOnly = new Date(`${dateKey}T00:00:00`);
  const day = await prisma.tradingDay.findUnique({
    where: { date: dateOnly },
    include: { graderNotes: { orderBy: { createdAt: "asc" } } },
  });

  return {
    dateKey,
    bias: day?.graderBias ?? null,
    notes: (day?.graderNotes ?? []).map((n) => ({
      id: n.id,
      text: n.text,
      createdAtIso: n.createdAt.toISOString(),
    })),
  };
}

export type SetupGraderSessionData = Awaited<ReturnType<typeof getSetupGraderSessionData>>;

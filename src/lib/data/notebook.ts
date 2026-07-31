import { prisma } from "@/lib/prisma";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getNotebookEntry(date: string) {
  return prisma.notebookEntry.findUnique({
    where: { date: new Date(`${date}T00:00:00`) },
  });
}

// Date keys (yyyy-MM-dd) of every entry with non-empty content in the given
// month, used to highlight days on the Notebook page's mini calendar.
export async function listNotebookDatesInMonth(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const entries = await prisma.notebookEntry.findMany({
    where: { date: { gte: start, lt: end }, content: { not: "" } },
    select: { date: true },
  });
  return new Set(entries.map((e) => dateKey(e.date)));
}

export async function listRecentNotebookEntries(limit = 10) {
  return prisma.notebookEntry.findMany({
    where: { content: { not: "" } },
    orderBy: { date: "desc" },
    take: limit,
  });
}

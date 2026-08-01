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

// ---------- Notebook folders ----------

export async function listNotebookFolders() {
  return prisma.notebookFolder.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { notes: true } } },
  });
}

export async function getNotebookFolder(id: string) {
  return prisma.notebookFolder.findUnique({ where: { id } });
}

export async function listNotesInFolder(folderId: string) {
  return prisma.notebookNote.findMany({
    where: { folderId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getNotebookNote(id: string) {
  return prisma.notebookNote.findUnique({ where: { id } });
}

// Fetched once per page load for client-side search filtering — this app
// is single-user/local-first-feeling, so filtering an already-fetched list
// client-side (same approach ChartGallery uses for its grade filter) beats
// a server round-trip per keystroke.
export async function listAllNotesForSearch() {
  return prisma.notebookNote.findMany({
    select: { id: true, folderId: true, title: true, content: true },
    orderBy: { updatedAt: "desc" },
  });
}

export type RecentNotebookItem =
  | { kind: "daily"; date: string; updatedAt: Date; label: string }
  | { kind: "note"; id: string; folderId: string; updatedAt: Date; label: string };

// Merges the two independent "recently touched" sources — daily entries
// and folder notes — into one chronological list for the sidebar.
export async function listRecentNotebookItems(
  limit = 8,
): Promise<RecentNotebookItem[]> {
  const [entries, notes] = await Promise.all([
    listRecentNotebookEntries(limit),
    prisma.notebookNote.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
  ]);

  const dailyItems: RecentNotebookItem[] = entries.map((e) => ({
    kind: "daily",
    date: dateKey(e.date),
    updatedAt: e.updatedAt,
    label: dateKey(e.date),
  }));
  const noteItems: RecentNotebookItem[] = notes.map((n) => ({
    kind: "note",
    id: n.id,
    folderId: n.folderId,
    updatedAt: n.updatedAt,
    label: n.title,
  }));

  return [...dailyItems, ...noteItems]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

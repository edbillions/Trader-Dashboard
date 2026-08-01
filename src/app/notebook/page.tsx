import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import {
  getNotebookEntry,
  listNotebookDatesInMonth,
  listNotebookFolders,
  listRecentNotebookItems,
  listAllNotesForSearch,
  getNotebookFolder,
  listNotesInFolder,
  getNotebookNote,
} from "@/lib/data/notebook";
import { createNotebookNoteAction } from "@/lib/actions/notebook";
import { NotebookEditor } from "@/components/notebook/notebook-editor";
import { NotebookCalendar } from "@/components/notebook/notebook-calendar";
import { NotebookSidebar } from "@/components/notebook/notebook-sidebar";
import { NotebookNotesList } from "@/components/notebook/notebook-notes-list";
import { NotebookNoteEditor } from "@/components/notebook/notebook-note-editor";

export const dynamic = "force-dynamic";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function NotebookPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    year?: string;
    month?: string;
    folder?: string;
    note?: string;
  }>;
}) {
  const params = await searchParams;
  const [folders, recent, allNotesForSearch] = await Promise.all([
    listNotebookFolders(),
    listRecentNotebookItems(),
    listAllNotesForSearch(),
  ]);

  if (params.folder) {
    const [folder, notes] = await Promise.all([
      getNotebookFolder(params.folder),
      listNotesInFolder(params.folder),
    ]);
    if (!folder) redirect("/notebook");

    const selectedNote = params.note ? await getNotebookNote(params.note) : null;

    return (
      <div>
        <PageHeader
          title="Notebook"
          description="Quick notes for the trading session — autosaves as you type."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_260px_1fr]">
          <NotebookSidebar
            folders={folders}
            recent={recent}
            allNotesForSearch={allNotesForSearch}
            activeFolderId={folder.id}
          />
          <NotebookNotesList
            folder={folder}
            notes={notes}
            activeNoteId={selectedNote?.id ?? null}
          />
          {selectedNote ? (
            <NotebookNoteEditor key={selectedNote.id} note={selectedNote} />
          ) : (
            <div className="flex h-fit flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface p-12 text-center">
              <p className="text-sm text-muted">
                Select a note, or create one to get started.
              </p>
              <form action={createNotebookNoteAction}>
                <input type="hidden" name="folderId" value={folder.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
                >
                  + New note
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  const date = params.date ?? todayKey();
  const dateObj = new Date(`${date}T00:00:00`);
  const year = params.year ? Number(params.year) : dateObj.getFullYear();
  const month = params.month ? Number(params.month) : dateObj.getMonth();

  const [entry, notesDates] = await Promise.all([
    getNotebookEntry(date),
    listNotebookDatesInMonth(year, month),
  ]);

  return (
    <div>
      <PageHeader
        title="Notebook"
        description="Quick notes for the trading session — autosaves as you type."
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/notebook?date=${shiftDate(date, -1)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            ← Prev day
          </Link>
          <Link
            href={`/notebook?date=${todayKey()}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            Today
          </Link>
          <Link
            href={`/notebook?date=${shiftDate(date, 1)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            Next day →
          </Link>
        </div>
        <span className="text-sm font-medium text-foreground">
          {format(dateObj, "EEEE, MMM d, yyyy")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_280px]">
        <NotebookSidebar
          folders={folders}
          recent={recent}
          allNotesForSearch={allNotesForSearch}
          activeFolderId={null}
        />
        <NotebookEditor
          key={date}
          date={date}
          initialContent={entry?.content ?? ""}
        />
        <NotebookCalendar
          year={year}
          month={month}
          notesDates={notesDates}
          selectedDate={date}
        />
      </div>
    </div>
  );
}

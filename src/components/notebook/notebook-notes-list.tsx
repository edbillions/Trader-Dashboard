import Link from "next/link";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { createNotebookNoteAction } from "@/lib/actions/notebook";

interface NoteListItem {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
}

export function NotebookNotesList({
  folder,
  notes,
  activeNoteId,
}: {
  folder: { id: string; name: string };
  notes: NoteListItem[];
  activeNoteId: string | null;
}) {
  return (
    <div className="flex h-fit flex-col gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {folder.name}
        </h2>
        <form action={createNotebookNoteAction}>
          <input type="hidden" name="folderId" value={folder.id} />
          <button
            type="submit"
            className="text-xs font-medium text-accent hover:underline"
          >
            + New note
          </button>
        </form>
      </div>

      {notes.length === 0 ? (
        <p className="px-2 text-xs text-muted">No notes in this folder yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notebook?folder=${folder.id}&note=${note.id}`}
              className={clsx(
                "relative flex flex-col gap-0.5 rounded-lg px-3 py-2 transition-all",
                activeNoteId === note.id
                  ? "bg-surface-raised before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent before:content-['']"
                  : "hover:bg-surface-raised",
              )}
            >
              <span className="truncate text-sm font-medium text-foreground">
                {note.title || "Untitled"}
              </span>
              <span className="truncate text-xs text-muted">
                {note.content.slice(0, 80) || "No content yet"}
              </span>
              <span className="text-[10px] text-muted/70">
                Updated {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

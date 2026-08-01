"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  createNotebookFolderAction,
  deleteNotebookFolderAction,
} from "@/lib/actions/notebook";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FOLDER_COLORS, folderColorClass } from "@/lib/domain/notebook-colors";
import type { RecentNotebookItem } from "@/lib/data/notebook";

interface FolderWithCount {
  id: string;
  name: string;
  color: string | null;
  _count: { notes: number };
}

interface SearchableNote {
  id: string;
  folderId: string;
  title: string;
  content: string;
}

function navClass(active: boolean): string {
  return clsx(
    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
    active
      ? "bg-surface-raised text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent before:content-['']"
      : "text-muted hover:bg-surface-raised hover:text-foreground",
  );
}

export function NotebookSidebar({
  folders,
  recent,
  allNotesForSearch,
  activeFolderId,
}: {
  folders: FolderWithCount[];
  recent: RecentNotebookItem[];
  allNotesForSearch: SearchableNote[];
  activeFolderId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [showRecent, setShowRecent] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderColor, setNewFolderColor] = useState<string>("");

  const q = query.trim().toLowerCase();
  const searchResults = q
    ? allNotesForSearch.filter(
        (n) =>
          n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
      )
    : [];

  return (
    <div className="flex h-fit flex-col gap-4 rounded-xl border border-border bg-surface p-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes..."
        className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
      />

      {q ? (
        <div className="flex flex-col gap-1">
          <span className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted/60">
            Results ({searchResults.length})
          </span>
          {searchResults.length === 0 ? (
            <p className="px-1 text-xs text-muted">No notes match.</p>
          ) : (
            searchResults.map((n) => (
              <Link
                key={n.id}
                href={`/notebook?folder=${n.folderId}&note=${n.id}`}
                className="truncate rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-raised hover:text-foreground"
              >
                {n.title}
              </Link>
            ))
          )}
        </div>
      ) : (
        <>
          <Link href="/notebook" className={navClass(activeFolderId === null)}>
            Daily Notes
          </Link>

          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setShowRecent((v) => !v)}
              className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-muted/60"
            >
              Recent
              <span>{showRecent ? "−" : "+"}</span>
            </button>
            {showRecent &&
              (recent.length === 0 ? (
                <p className="px-3 text-xs text-muted">Nothing yet.</p>
              ) : (
                recent.map((item) => (
                  <Link
                    key={item.kind === "daily" ? `d-${item.date}` : `n-${item.id}`}
                    href={
                      item.kind === "daily"
                        ? `/notebook?date=${item.date}`
                        : `/notebook?folder=${item.folderId}&note=${item.id}`
                    }
                    className="truncate rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-surface-raised hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))
              ))}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                Folders
              </span>
              <button
                type="button"
                onClick={() => setShowNewFolder((v) => !v)}
                className="text-xs font-medium text-accent hover:underline"
              >
                + New
              </button>
            </div>

            {showNewFolder && (
              <form
                action={createNotebookFolderAction}
                className="mb-2 flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-2.5"
              >
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Folder name"
                  className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  {(Object.keys(FOLDER_COLORS) as (keyof typeof FOLDER_COLORS)[]).map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewFolderColor(key)}
                        className={clsx(
                          "h-5 w-5 rounded-full",
                          FOLDER_COLORS[key],
                          newFolderColor === key && "ring-2 ring-foreground ring-offset-2 ring-offset-surface-raised",
                        )}
                        aria-label={key}
                      />
                    ),
                  )}
                </div>
                <input type="hidden" name="color" value={newFolderColor} />
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
                >
                  Create folder
                </button>
              </form>
            )}

            {folders.length === 0 ? (
              <p className="px-3 text-xs text-muted">No folders yet.</p>
            ) : (
              folders.map((folder) => (
                <div key={folder.id} className="group flex items-center gap-1">
                  <Link
                    href={`/notebook?folder=${folder.id}`}
                    className={clsx(navClass(activeFolderId === folder.id), "flex-1")}
                  >
                    <span
                      className={clsx(
                        "h-2 w-2 shrink-0 rounded-full",
                        folderColorClass(folder.color),
                      )}
                    />
                    <span className="truncate">{folder.name}</span>
                    <span className="ml-auto text-xs text-muted">
                      {folder._count.notes}
                    </span>
                  </Link>
                  <form action={deleteNotebookFolderAction}>
                    <input type="hidden" name="id" value={folder.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Delete "${folder.name}" and all ${folder._count.notes} note(s) inside it? This can't be undone.`}
                      className="hidden px-1 text-xs text-muted hover:text-loss group-hover:block"
                    >
                      ✕
                    </ConfirmSubmitButton>
                  </form>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

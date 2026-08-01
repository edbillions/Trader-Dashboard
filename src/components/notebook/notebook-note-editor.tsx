"use client";

import { useEffect, useRef, useState } from "react";
import { saveNotebookNoteAction } from "@/lib/actions/notebook";

// Fully remounted (via a `key={note.id}` prop from the parent) whenever the
// selected note changes, so state always starts fresh for the new note —
// same trick NotebookEditor uses, keyed by note id instead of date.
export function NotebookNoteEditor({
  note,
}: {
  note: { id: string; title: string; content: string };
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [status, setStatus] = useState<{
    state: "idle" | "saving" | "saved";
    at: Date | null;
  }>({ state: "idle", at: null });

  const titleRef = useRef(note.title);
  const contentRef = useRef(note.content);
  const savedRef = useRef({ title: note.title, content: note.content });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(nextTitle: string, nextContent: string) {
    titleRef.current = nextTitle;
    contentRef.current = nextContent;
    setStatus({ state: "saving", at: null });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      savedRef.current = { title: nextTitle, content: nextContent };
      saveNotebookNoteAction(note.id, nextTitle, nextContent).then(() => {
        setStatus({ state: "saved", at: new Date() });
      });
    }, 800);
  }

  // Flush any pending debounced save when navigating away.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (
        titleRef.current !== savedRef.current.title ||
        contentRef.current !== savedRef.current.content
      ) {
        saveNotebookNoteAction(note.id, titleRef.current, contentRef.current);
      }
    };
  }, [note.id]);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setTitle(next);
    scheduleSave(next, content);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setContent(next);
    scheduleSave(title, next);
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-muted"
        />
        <span className="shrink-0 text-xs text-muted">
          {status.state === "saving"
            ? "Saving..."
            : status.state === "saved" && status.at
              ? `Saved ${status.at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
              : " "}
        </span>
      </div>
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="Start writing..."
        spellCheck={false}
        className="min-h-[560px] flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted"
      />
    </div>
  );
}

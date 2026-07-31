"use client";

import { useEffect, useRef, useState } from "react";
import { saveNotebookEntryAction } from "@/lib/actions/notebook";

// Fully remounted (via a `key={date}` prop from the parent) whenever the
// viewed date changes, so state always starts fresh for the new day.
export function NotebookEditor({
  date,
  initialContent,
}: {
  date: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef(initialContent);
  const savedRef = useRef(initialContent);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(next: string) {
    contentRef.current = next;
    setStatus("saving");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      savedRef.current = next;
      saveNotebookEntryAction(date, next).then(() => setStatus("saved"));
    }, 800);
  }

  // Flush any pending debounced save when navigating away, so a quick
  // day-switch mid-session never silently drops the last few keystrokes.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (contentRef.current !== savedRef.current) {
        saveNotebookEntryAction(date, contentRef.current);
      }
    };
  }, [date]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setContent(next);
    scheduleSave(next);
  }

  function insertTimestamp() {
    const textarea = textareaRef.current;
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const stamp = `[${time}] `;
    const selectionStart = textarea?.selectionStart ?? content.length;
    const selectionEnd = textarea?.selectionEnd ?? content.length;
    const next =
      content.slice(0, selectionStart) + stamp + content.slice(selectionEnd);
    setContent(next);
    scheduleSave(next);
    requestAnimationFrame(() => {
      if (!textarea) return;
      const cursor = selectionStart + stamp.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <button
          type="button"
          onClick={insertTimestamp}
          className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground"
        >
          + Timestamp
        </button>
        <span className="text-xs text-muted">
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : " "}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder="Bias, levels, running notes for the session..."
        autoFocus
        spellCheck={false}
        className="min-h-[560px] flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted"
      />
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import {
  addSetupGraderNoteAction,
  deleteSetupGraderNoteAction,
  setSetupGraderBiasAction,
} from "@/lib/actions/setup-grader";

type Bias = "bullish" | "bearish" | "neutral";

interface NoteItem {
  id: string;
  text: string;
  createdAtIso: string;
}

const BIAS_OPTIONS: { key: Bias; label: string }[] = [
  { key: "bullish", label: "Bullish" },
  { key: "bearish", label: "Bearish" },
  { key: "neutral", label: "Neutral" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SessionNotesPanel({
  dateKey,
  initialBias,
  initialNotes,
}: {
  dateKey: string;
  initialBias: string | null;
  initialNotes: NoteItem[];
}) {
  const [bias, setBias] = useState<Bias | null>(initialBias as Bias | null);
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function pickBias(next: Bias) {
    setBias(next); // instant — no debounce needed for a discrete pick
    startTransition(async () => {
      await setSetupGraderBiasAction(dateKey, next);
    });
  }

  function submitNote() {
    const text = draft.trim();
    if (!text) return;
    setDraft(""); // clear immediately so the input is ready for the next entry
    startTransition(async () => {
      const note = await addSetupGraderNoteAction(dateKey, text);
      setNotes((prev) => [...prev, note]);
    });
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id)); // optimistic
    startTransition(async () => {
      await deleteSetupGraderNoteAction(id);
    });
  }

  return (
    <section className="session-panel">
      <div className="session-panel-hdr">Session Notes</div>
      <div className="session-panel-body">
        <div className="bias-row">
          <span className="bias-label">Daily bias</span>
          <div className="bias-pills">
            {BIAS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => pickBias(opt.key)}
                className={clsx(
                  "bias-pill",
                  bias === opt.key && `active-${opt.key}`,
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <form
          className="note-form"
          onSubmit={(e) => {
            e.preventDefault();
            submitNote();
          }}
        >
          <input
            className="note-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="NQ - Leaning bullish, holding for hr targets..."
          />
          <button type="submit" className="note-add-btn" disabled={!draft.trim() || isPending}>
            Add
          </button>
        </form>

        <div className="note-list">
          {notes.length === 0 ? (
            <p className="note-empty">No notes yet — add your first observation above.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="note-row">
                <span className="note-time">{formatTime(n.createdAtIso)}</span>
                <span className="note-text">{n.text}</span>
                <button
                  type="button"
                  className="note-del-btn"
                  onClick={() => removeNote(n.id)}
                  aria-label="Delete note"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

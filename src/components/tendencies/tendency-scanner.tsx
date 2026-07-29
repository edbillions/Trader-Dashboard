"use client";

import { useState, useTransition } from "react";
import {
  scanTendenciesAction,
  applyTendencyMatchesAction,
  createTendencyAction,
} from "@/lib/actions/tendencies";

interface Match {
  id: string;
  title: string;
  evidence: string;
}

interface Candidate {
  title: string;
  description: string;
  evidence: string;
}

export function TendencyScanner() {
  const [isScanning, startScan] = useTransition();
  const [isApplying, startApply] = useTransition();
  const [result, setResult] = useState<{
    matches: Match[];
    candidates: Candidate[];
  } | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  function handleScan() {
    setUnavailable(false);
    startScan(async () => {
      const res = await scanTendenciesAction();
      if (!res.available) {
        setUnavailable(true);
        setResult(null);
        return;
      }
      setResult({ matches: res.matches, candidates: res.candidates });
    });
  }

  function handleConfirmMatches() {
    if (!result || result.matches.length === 0) return;
    const fd = new FormData();
    fd.set("ids", result.matches.map((m) => m.id).join(","));
    startApply(async () => {
      await applyTendencyMatchesAction(fd);
      setResult((r) => (r ? { ...r, matches: [] } : r));
    });
  }

  function handleAddCandidate(c: Candidate) {
    const fd = new FormData();
    fd.set("title", c.title);
    fd.set("description", c.description);
    startApply(async () => {
      await createTendencyAction(fd);
      setResult((r) =>
        r
          ? { ...r, candidates: r.candidates.filter((x) => x.title !== c.title) }
          : r,
      );
    });
  }

  return (
    <section className="mb-8 rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Scan recent trades for tendencies
        </h3>
        <button
          type="button"
          onClick={handleScan}
          disabled={isScanning}
          className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
        >
          {isScanning ? "Scanning..." : result ? "Scan again" : "Scan trades"}
        </button>
      </div>

      {unavailable && (
        <p className="mt-2 text-xs text-muted">
          AI features aren&apos;t available — add your Claude API key in
          Settings.
        </p>
      )}

      {result && (
        <div className="mt-3 flex flex-col gap-4">
          {result.matches.length === 0 && result.candidates.length === 0 && (
            <p className="text-sm text-muted">
              No tendencies flagged in the recent trades.
            </p>
          )}

          {result.matches.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                Flagged this scan
              </p>
              <div className="flex flex-col gap-1.5">
                {result.matches.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-border bg-surface p-2.5 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {m.title}
                    </span>
                    <p className="mt-0.5 text-xs text-muted">{m.evidence}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleConfirmMatches}
                disabled={isApplying}
                className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised disabled:opacity-60"
              >
                Confirm — mark as seen today
              </button>
            </div>
          )}

          {result.candidates.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                Candidate new tendencies
              </p>
              <div className="flex flex-col gap-1.5">
                {result.candidates.map((c) => (
                  <div
                    key={c.title}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-2.5 text-sm"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        {c.title}
                      </span>
                      <p className="mt-0.5 text-xs text-muted">
                        {c.description}
                      </p>
                      <p className="mt-1 text-xs italic text-muted">
                        {c.evidence}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddCandidate(c)}
                      disabled={isApplying}
                      className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-foreground hover:bg-surface-raised disabled:opacity-50"
                    >
                      Add to list
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

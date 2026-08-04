"use client";

import { useRef, useState } from "react";
import { formatCurrency } from "@/lib/pnl";
import type { SessionGrade } from "@/lib/domain/session-grade";
import type { IdentityPing } from "@/lib/domain/identity-pings";

export interface ScorecardShareData {
  dateLabel: string;
  grade: SessionGrade;
  disciplineScore100: number;
  netPnlToday: number;
  tradesTaken: number;
  winRate: number | null;
  identityPings: IdentityPing[];
}

const GRADE_COLOR: Record<SessionGrade["letter"], string> = {
  A: "#22c55e",
  B: "#7c6cf6",
  C: "#eab308",
  D: "#f0475a",
};

export function ScorecardPreviewModal({ data }: { data: ScorecardShareData }) {
  const [open, setOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const scorecardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<"report" | "scorecard" | null>(null);

  async function handleDownload(kind: "report" | "scorecard") {
    const node = kind === "report" ? reportRef.current : scorecardRef.current;
    if (!node) return;
    setDownloading(kind);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${kind === "report" ? "daily-session-report" : "daily-scorecard"}-${data.dateLabel}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised"
      >
        Share scorecard
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-6 overflow-y-auto rounded-xl border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Shareable scorecards</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div>
              <div
                ref={reportRef}
                style={{
                  background: "linear-gradient(135deg, #13151c 0%, #191c26 100%)",
                  padding: "32px",
                  borderRadius: "16px",
                  color: "#e8e9ee",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <p style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#7c6cf6", fontWeight: 700 }}>
                  Trader Hub — Daily Session Report
                </p>
                <p style={{ fontSize: 11, color: "#9299ad", marginTop: 2 }}>{data.dateLabel}</p>
                <p style={{ fontSize: 56, fontWeight: 800, marginTop: 16, color: GRADE_COLOR[data.grade.letter] }}>
                  {data.grade.letter}
                  <span style={{ fontSize: 18, fontWeight: 500, color: "#e8e9ee", marginLeft: 12 }}>
                    — {data.grade.tagline}
                  </span>
                </p>
                <p style={{ fontSize: 14, color: "#9299ad", marginTop: 8 }}>
                  Discipline Score {data.disciplineScore100}/100
                </p>
                <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
                  <Metric label="Net P&L" value={formatCurrency(data.netPnlToday)} />
                  <Metric label="Trades" value={`${data.tradesTaken}`} />
                  <Metric
                    label="Win rate"
                    value={data.winRate != null ? `${data.winRate.toFixed(0)}%` : "—"}
                  />
                </div>
                {data.identityPings.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
                    {data.identityPings.map((p) => (
                      <span
                        key={p.label}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: p.positive ? "#16341f" : "#3a1620",
                          color: p.positive ? "#22c55e" : "#f0475a",
                        }}
                      >
                        {p.points > 0 ? "+" : ""}
                        {p.points} {p.label}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 11, color: "#5a6070", marginTop: 24, letterSpacing: 1 }}>
                  DISCIPLINE BEFORE P&amp;L.
                </p>
              </div>
              <button
                type="button"
                disabled={downloading === "report"}
                onClick={() => handleDownload("report")}
                className="mt-2 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {downloading === "report" ? "Preparing..." : "Download Session Report"}
              </button>
            </div>

            <div>
              <div
                ref={scorecardRef}
                style={{
                  background: "#13151c",
                  padding: "20px",
                  borderRadius: "14px",
                  color: "#e8e9ee",
                  fontFamily: "system-ui, sans-serif",
                  maxWidth: 320,
                }}
              >
                <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#7c6cf6", fontWeight: 700 }}>
                  Trader Hub — Daily Scorecard
                </p>
                <p style={{ fontSize: 36, fontWeight: 800, marginTop: 8, color: GRADE_COLOR[data.grade.letter] }}>
                  {data.grade.letter}
                </p>
                <p style={{ fontSize: 12, color: "#9299ad" }}>{data.disciplineScore100}/100 · {data.dateLabel}</p>
                <p style={{ fontSize: 20, fontWeight: 700, marginTop: 10, color: data.netPnlToday >= 0 ? "#22c55e" : "#f0475a" }}>
                  {formatCurrency(data.netPnlToday)}
                </p>
                <p style={{ fontSize: 10, color: "#5a6070", marginTop: 12 }}>DISCIPLINE BEFORE P&amp;L.</p>
              </div>
              <button
                type="button"
                disabled={downloading === "scorecard"}
                onClick={() => handleDownload("scorecard")}
                className="mt-2 w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised disabled:opacity-50"
              >
                {downloading === "scorecard" ? "Preparing..." : "Download Scorecard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: "#9299ad", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

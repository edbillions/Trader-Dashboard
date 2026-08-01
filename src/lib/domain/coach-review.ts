export interface CoachReview {
  quickRead: string;
  whatMattered: string;
  mainImprovement: string;
  nextTradeRule: string;
}

export interface CoachReviewTradeInput {
  symbol: string;
  direction: string;
  netPnl: number | null;
  rMultiple: number | null;
  setupGrade: string | null;
  writeup: string | null;
  stopLossPlanned: number | null;
  stopLossActual: number | null;
  mfeR: number | null;
  maeR: number | null;
  mistakes: { label: string }[];
  confluenceFactors: { label: string }[];
}

function outcomeWord(netPnl: number | null): string {
  if (netPnl == null) return "Open";
  if (netPnl > 0) return "Win";
  if (netPnl < 0) return "Loss";
  return "Breakeven";
}

function writeupExcerpt(writeup: string | null): string | null {
  if (!writeup) return null;
  const trimmed = writeup.trim();
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 140).trim()}...`;
}

function stopWasMoved(trade: CoachReviewTradeInput): boolean {
  return (
    trade.stopLossPlanned != null &&
    trade.stopLossActual != null &&
    trade.stopLossPlanned !== trade.stopLossActual
  );
}

export function computeCoachReview(trade: CoachReviewTradeInput): CoachReview {
  // ---------- Quick Read ----------
  const outcome = outcomeWord(trade.netPnl);
  const dollarPart =
    trade.netPnl != null
      ? `${trade.netPnl >= 0 ? "+" : "-"}$${Math.abs(trade.netPnl).toFixed(2)}`
      : "no P&L yet";
  const rPart = trade.rMultiple != null ? ` (${trade.rMultiple.toFixed(2)}R)` : "";
  let quickRead = `${trade.symbol} ${trade.direction} ended ${outcome} for ${dollarPart}${rPart}.`;
  if (trade.confluenceFactors.length > 0) {
    quickRead += ` Setup evidence: ${trade.confluenceFactors.map((c) => c.label).join(", ")}.`;
  }
  const excerpt = writeupExcerpt(trade.writeup);
  if (excerpt) {
    quickRead += ` Confirmed in your note: "${excerpt}"`;
  }

  // ---------- What Mattered ----------
  let whatMattered: string;
  if (trade.setupGrade === "A+" || trade.setupGrade === "A") {
    whatMattered = `The setup was graded ${trade.setupGrade} — identify which part of the process deserves to be repeated.`;
  } else if (trade.confluenceFactors.length >= 3) {
    whatMattered = `Confluence stacked: ${trade.confluenceFactors.length} factors present before entry.`;
  } else if (
    (trade.netPnl ?? 0) > 0 &&
    !stopWasMoved(trade) &&
    trade.stopLossPlanned != null
  ) {
    whatMattered = "Risk management held — the stop was never moved from plan.";
  } else if (trade.mistakes.length === 0) {
    whatMattered = "No mistakes flagged on this trade.";
  } else {
    whatMattered = "Logged cleanly, no red flags in the trade record.";
  }

  // ---------- Main Improvement + Next Trade Rule ----------
  let mainImprovement: string;
  let nextTradeRule: string;
  if (trade.mistakes.length > 0) {
    const label = trade.mistakes[0].label;
    mainImprovement = `A mistake was tagged on this trade: ${label}.`;
    nextTradeRule = `Before the next trade, explicitly check for "${label}" before entering.`;
  } else if (stopWasMoved(trade)) {
    mainImprovement =
      "The stop was moved from your planned level — was that justified by structure, or by discomfort?";
    nextTradeRule =
      "Only move your stop when market structure changes — not because price is close or feels uncomfortable.";
  } else if (
    trade.maeR != null &&
    trade.rMultiple != null &&
    trade.maeR > Math.max(trade.rMultiple, 0) + 0.5
  ) {
    mainImprovement =
      "The trade went further against you than the eventual result implied — the invalidation level may have been too tight or too wide.";
    nextTradeRule =
      "Review whether your stop placement matches the actual invalidation point, not just a fixed distance.";
  } else if (
    trade.setupGrade === "C" ||
    trade.setupGrade === "D" ||
    trade.setupGrade === "F"
  ) {
    mainImprovement = `The setup was graded ${trade.setupGrade} — entry criteria weren't fully met.`;
    nextTradeRule =
      "Only take entries that fully match your setup checklist — no exceptions when confluence is weak.";
  } else {
    mainImprovement =
      "No clear process breakdown detected on this trade — the main lever left is execution consistency.";
    nextTradeRule = "Repeat what worked here — no rule changes needed from this trade.";
  }

  return { quickRead, whatMattered, mainImprovement, nextTradeRule };
}

export interface TiltTradeInput {
  id: string;
  entryTime: Date;
  exitTime: Date | null;
  positionSize: number;
  netPnl: number | null;
  session: string | null;
}

export interface TiltDayInput {
  date: string;
  maxTradeCountPlan: number | null;
  sessionTiming: string | null;
  trades: TiltTradeInput[];
}

export interface TiltSignal {
  date: string;
  type: "overtrading" | "revenge_trading" | "size_up_after_loss" | "off_plan";
  detail: string;
}

const REVENGE_WINDOW_MINUTES = 15;

export function detectTiltSignals(day: TiltDayInput): TiltSignal[] {
  const signals: TiltSignal[] = [];

  if (
    day.maxTradeCountPlan != null &&
    day.trades.length > day.maxTradeCountPlan
  ) {
    signals.push({
      date: day.date,
      type: "overtrading",
      detail: `Took ${day.trades.length} trades against a plan of ${day.maxTradeCountPlan}.`,
    });
  }

  const sorted = [...day.trades].sort(
    (a, b) => a.entryTime.getTime() - b.entryTime.getTime(),
  );

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevWasLoss = (prev.netPnl ?? 0) < 0;
    if (!prevWasLoss || !prev.exitTime) continue;

    const gapMinutes =
      (curr.entryTime.getTime() - prev.exitTime.getTime()) / 60000;
    if (gapMinutes >= 0 && gapMinutes <= REVENGE_WINDOW_MINUTES) {
      signals.push({
        date: day.date,
        type: "revenge_trading",
        detail: `Re-entered ${Math.round(gapMinutes)} min after a loss.`,
      });
    }

    if (curr.positionSize > prev.positionSize) {
      signals.push({
        date: day.date,
        type: "size_up_after_loss",
        detail: `Sized up from ${prev.positionSize} to ${curr.positionSize} contracts after a loss.`,
      });
    }
  }

  // Heuristic: flag a trade's session as off-plan only when the day's
  // freeform session-timing note is specific enough to compare against
  // (doesn't mention the session the trade was actually tagged with).
  if (day.sessionTiming && day.sessionTiming.trim().length > 0) {
    const planText = day.sessionTiming.toLowerCase();
    for (const trade of day.trades) {
      if (trade.session && !planText.includes(trade.session.toLowerCase())) {
        signals.push({
          date: day.date,
          type: "off_plan",
          detail: `Traded "${trade.session}" session, not mentioned in the day's session plan.`,
        });
      }
    }
  }

  return signals;
}

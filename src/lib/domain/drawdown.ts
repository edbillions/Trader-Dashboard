export interface DrawdownResult {
  currentEquity: number;
  peakEquity: number;
  currentDrawdown: number;
}

// Walks trades in chronological order building an equity curve off the
// starting balance, tracking the running peak so we can report the current
// drawdown from that peak (trading P&L only — fees/payouts aren't part of
// a prop firm's drawdown calculation).
export function computeDrawdown(
  startingBalance: number,
  chronologicalNetPnls: number[],
): DrawdownResult {
  let equity = startingBalance;
  let peak = startingBalance;
  for (const pnl of chronologicalNetPnls) {
    equity += pnl;
    if (equity > peak) peak = equity;
  }
  return {
    currentEquity: equity,
    peakEquity: peak,
    currentDrawdown: Math.max(0, peak - equity),
  };
}

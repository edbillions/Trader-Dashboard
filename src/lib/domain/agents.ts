import { computeTradeStreaks } from "@/lib/domain/streaks";
import type { TiltSignal } from "@/lib/domain/tilt";

export type AgentTone = "ok" | "watch" | "alert";

export interface AgentGauge {
  label: string;
  usedLabel: string;
  limitLabel: string;
  pct: number | null;
  danger?: boolean;
}

export interface AgentInsight {
  id: "risk" | "habit" | "pattern" | "sentiment";
  label: string;
  icon: string;
  pillLabel: string;
  tone: AgentTone;
  headline: string;
  detail?: string;
  bullets?: string[];
  gauges?: AgentGauge[];
  recommendation?: string;
  ctaHref?: string;
}

const TONE_PILL: Record<AgentTone, string> = {
  ok: "On track",
  watch: "Watch",
  alert: "Alert",
};

// Avg magnitude of losing trades, for "one more average loss would breach
// your plan" projections. Filters internally so callers can pass any mix.
export function computeAvgLossSize(
  trades: { netPnl: number | null }[],
): number | null {
  const losses = trades
    .map((t) => t.netPnl)
    .filter((pnl): pnl is number => pnl != null && pnl < 0)
    .map((pnl) => Math.abs(pnl));
  if (losses.length === 0) return null;
  return losses.reduce((a, b) => a + b, 0) / losses.length;
}

export interface GroupStatLike {
  label: string;
  count: number;
  winRate: number | null;
  netPnl: number;
  avgR: number | null;
}

// The single worst-performing bucket by net P&L, requiring a minimum sample
// so a one-off loss on a thinly-traded hour doesn't look like a pattern.
export function findWorstHourBucket(
  byHour: GroupStatLike[],
  minCount = 3,
): GroupStatLike | null {
  const eligible = byHour.filter((b) => b.count >= minCount && b.netPnl < 0);
  if (eligible.length === 0) return null;
  return eligible.reduce((worst, b) => (b.netPnl < worst.netPnl ? b : worst));
}

// The single strongest edge across a pool of candidate breakdowns (session,
// entry model, etc.), requiring a minimum sample and a positive win rate.
export function findStrongestEdge(
  candidates: GroupStatLike[],
  minCount = 3,
): GroupStatLike | null {
  const eligible = candidates.filter(
    (c) => c.count >= minCount && c.netPnl > 0,
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((best, c) => (c.netPnl > best.netPnl ? c : best));
}

// ---------- Risk agent ----------

export interface RiskAgentInput {
  maxLossPlan: number | null;
  maxTradeCountPlan: number | null;
  todayTrades: { netPnl: number | null; accountId: string | null }[];
  avgLossSize: number | null;
  accountDailyLossLimits: Map<string, number>;
}

export function computeRiskAgent(input: RiskAgentInput): AgentInsight {
  const { maxLossPlan, maxTradeCountPlan, todayTrades, avgLossSize } = input;

  const lossUsed = Math.abs(
    todayTrades
      .map((t) => t.netPnl ?? 0)
      .filter((pnl) => pnl < 0)
      .reduce((a, b) => a + b, 0),
  );
  const lossPct =
    maxLossPlan != null && maxLossPlan > 0
      ? (lossUsed / maxLossPlan) * 100
      : null;
  const tradeCountPct =
    maxTradeCountPlan != null && maxTradeCountPlan > 0
      ? (todayTrades.length / maxTradeCountPlan) * 100
      : null;

  const streaks = computeTradeStreaks(todayTrades);
  const consecutiveLossesToday =
    streaks.currentType === "loss" ? streaks.currentCount : 0;

  const projectedBreach =
    maxLossPlan != null &&
    avgLossSize != null &&
    lossUsed < maxLossPlan &&
    lossUsed + avgLossSize >= maxLossPlan;

  let accountBreach: string | null = null;
  const byAccount = new Map<string, number>();
  for (const t of todayTrades) {
    if (!t.accountId) continue;
    byAccount.set(t.accountId, (byAccount.get(t.accountId) ?? 0) + (t.netPnl ?? 0));
  }
  for (const [accountId, pnl] of byAccount) {
    const limit = input.accountDailyLossLimits.get(accountId);
    if (limit != null && pnl < 0 && Math.abs(pnl) >= limit) {
      accountBreach = accountId;
    }
  }

  let tone: AgentTone = "ok";
  if (
    (lossPct != null && lossPct >= 100) ||
    (tradeCountPct != null && tradeCountPct >= 100) ||
    consecutiveLossesToday >= 3 ||
    accountBreach
  ) {
    tone = "alert";
  } else if (
    (lossPct != null && lossPct >= 75) ||
    (tradeCountPct != null && tradeCountPct >= 75) ||
    consecutiveLossesToday === 2 ||
    projectedBreach
  ) {
    tone = "watch";
  }

  const bullets: string[] = [];
  if (consecutiveLossesToday >= 2) {
    bullets.push(
      `${consecutiveLossesToday} losses in a row today — consider stepping away.`,
    );
  }
  if (projectedBreach && avgLossSize != null) {
    bullets.push(
      `One more average-sized loss (~$${Math.round(avgLossSize)}) would breach your loss plan.`,
    );
  }
  if (accountBreach) {
    bullets.push("A linked account has hit its daily loss limit today.");
  }

  const gauges: AgentGauge[] = [];
  if (maxLossPlan != null) {
    gauges.push({
      label: "Loss budget used",
      usedLabel: `$${Math.round(lossUsed)}`,
      limitLabel: `$${Math.round(maxLossPlan)}`,
      pct: lossPct,
    });
  }
  if (maxTradeCountPlan != null) {
    gauges.push({
      label: "Trades taken",
      usedLabel: `${todayTrades.length}`,
      limitLabel: `${maxTradeCountPlan}`,
      pct: tradeCountPct,
    });
  }

  const headline =
    tone === "alert"
      ? "Risk plan breached — stop trading for today."
      : tone === "watch"
        ? "Approaching your risk limits."
        : maxLossPlan == null && maxTradeCountPlan == null
          ? "No risk plan set for today."
          : "Within your risk plan.";

  return {
    id: "risk",
    label: "Risk Management",
    icon: "🛡️",
    pillLabel: TONE_PILL[tone],
    tone,
    headline,
    bullets: bullets.length > 0 ? bullets : undefined,
    gauges: gauges.length > 0 ? gauges : undefined,
    recommendation:
      tone === "alert"
        ? "Close the platform. Today's plan is done."
        : tone === "watch"
          ? "Slow down — you're close to a limit."
          : undefined,
  };
}

// ---------- Habit agent ----------

export interface HabitAgentInput {
  journalingStreak: number;
  missedWeekdays: number;
  missedWeekdaysWindow: number;
}

export function computeHabitAgent(input: HabitAgentInput): AgentInsight {
  const { journalingStreak, missedWeekdays, missedWeekdaysWindow } = input;

  let tone: AgentTone = "ok";
  if (missedWeekdays >= 3) tone = "alert";
  else if (missedWeekdays >= 1) tone = "watch";

  const headline =
    journalingStreak > 0
      ? `${journalingStreak}-day journaling streak.`
      : "No active journaling streak.";

  const bullets: string[] = [];
  if (missedWeekdays > 0) {
    bullets.push(
      `Missed ${missedWeekdays} of the last ${missedWeekdaysWindow} trading days.`,
    );
  }

  return {
    id: "habit",
    label: "Habit",
    icon: "📓",
    pillLabel: TONE_PILL[tone],
    tone,
    headline,
    bullets: bullets.length > 0 ? bullets : undefined,
    recommendation:
      tone !== "ok" ? "Log today's plan and review before the close." : undefined,
    ctaHref: "/journal/new",
  };
}

// ---------- Pattern Detection agent ----------

export interface PatternAgentInput {
  byHour: GroupStatLike[];
  edgeCandidates: GroupStatLike[];
  revengeTradeCost: number;
  bestWinStreak: number;
}

export function computePatternAgent(input: PatternAgentInput): AgentInsight {
  const worstHour = findWorstHourBucket(input.byHour);
  const strongestEdge = findStrongestEdge(input.edgeCandidates);

  const bullets: string[] = [];
  if (worstHour) {
    bullets.push(
      `Your weakest hour is ${worstHour.label} (${worstHour.netPnl >= 0 ? "+" : ""}$${Math.round(worstHour.netPnl)} over ${worstHour.count} trades).`,
    );
  }
  if (strongestEdge) {
    bullets.push(
      `Your strongest edge is "${strongestEdge.label}" (${strongestEdge.winRate != null ? `${strongestEdge.winRate.toFixed(0)}% win rate, ` : ""}+$${Math.round(strongestEdge.netPnl)}).`,
    );
  }
  if (input.revengeTradeCost < 0) {
    bullets.push(
      `Revenge/size-up trades have cost you $${Math.round(Math.abs(input.revengeTradeCost))} over the last 30 days.`,
    );
  }
  if (input.bestWinStreak > 0) {
    bullets.push(`Best win streak: ${input.bestWinStreak} trades.`);
  }

  return {
    id: "pattern",
    label: "Pattern Detection",
    icon: "🔍",
    pillLabel: TONE_PILL.ok,
    tone: "ok",
    headline:
      bullets.length > 0
        ? "Patterns found in your trading history."
        : "Log more trades to unlock pattern detection.",
    bullets: bullets.length > 0 ? bullets.slice(0, 3) : undefined,
  };
}

// ---------- Sentiment / Tilt agent ----------

export interface SentimentAgentInput {
  todaySignals: TiltSignal[];
}

const SIGNAL_LABELS: Record<TiltSignal["type"], string> = {
  overtrading: "Overtrading",
  revenge_trading: "Revenge trading",
  size_up_after_loss: "Sized up after a loss",
  off_plan: "Off plan",
};

export function computeSentimentAgent(
  input: SentimentAgentInput,
): AgentInsight {
  const { todaySignals } = input;

  const hasSevere = todaySignals.some(
    (s) => s.type === "overtrading" || s.type === "revenge_trading",
  );
  const tone: AgentTone =
    todaySignals.length === 0 ? "ok" : hasSevere ? "alert" : "watch";

  return {
    id: "sentiment",
    label: "Sentiment / Tilt",
    icon: "🧠",
    pillLabel: TONE_PILL[tone],
    tone,
    headline:
      todaySignals.length === 0
        ? "No tilt signals detected today."
        : `${todaySignals.length} tilt signal${todaySignals.length === 1 ? "" : "s"} detected today.`,
    bullets:
      todaySignals.length > 0
        ? todaySignals.map((s) => `${SIGNAL_LABELS[s.type]}: ${s.detail}`)
        : undefined,
    recommendation:
      tone === "alert"
        ? "Step away from the screen for the rest of the session."
        : undefined,
  };
}

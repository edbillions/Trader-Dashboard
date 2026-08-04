// Live Session: trade-cooldown timer. Pure function — no I/O, no persistence.
// "Cooldown" means "time since the last trade hasn't yet cleared the
// configured minimum gap" — matches the reference app's cooldown countdown.

export interface CooldownInput {
  lastTradeTime: Date | null; // most recent trade's exitTime ?? entryTime
  cooldownMinutes: number;
  now?: Date;
}

export interface CooldownState {
  active: boolean;
  secondsRemaining: number; // 0 when inactive
  minutesSinceLastTrade: number | null; // null when no trades yet today
  recommendedAction: string;
}

export function computeCooldownState(input: CooldownInput): CooldownState {
  const now = input.now ?? new Date();

  if (!input.lastTradeTime) {
    return {
      active: false,
      secondsRemaining: 0,
      minutesSinceLastTrade: null,
      recommendedAction: "Clear to trade.",
    };
  }

  const elapsedSeconds = Math.max(
    0,
    (now.getTime() - input.lastTradeTime.getTime()) / 1000,
  );
  const cooldownSeconds = Math.max(0, input.cooldownMinutes) * 60;
  const secondsRemaining = Math.max(0, cooldownSeconds - elapsedSeconds);
  const active = secondsRemaining > 0;

  return {
    active,
    secondsRemaining: Math.ceil(secondsRemaining),
    minutesSinceLastTrade: Math.floor(elapsedSeconds / 60),
    recommendedAction: active
      ? "Step away from charts."
      : "Clear to trade.",
  };
}

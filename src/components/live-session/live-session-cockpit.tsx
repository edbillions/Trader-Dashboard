"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeCooldownState } from "@/lib/domain/cooldown";
import { computeCrashoutMeter, canTakeAnotherTrade } from "@/lib/domain/crashout-meter";
import { computeTradeStreaks } from "@/lib/domain/streaks";
import type { TiltSignal } from "@/lib/domain/tilt";
import { formatCurrency } from "@/lib/pnl";
import { CooldownCard } from "@/components/live-session/cooldown-card";
import { QuickLogPanel } from "@/components/live-session/quick-log-panel";
import { EmergencyButton } from "@/components/live-session/emergency-button";
import { CrashoutMeterPanel } from "@/components/live-session/crashout-meter-panel";
import { TodaysMissionCard } from "@/components/live-session/todays-mission-card";
import { EndSessionFlow } from "@/components/live-session/end-session-flow";

export interface LiveSessionCockpitProps {
  dateKey: string;
  cooldownMinutes: number;
  lastTradeTimeIso: string | null;
  emergencyPauseUntilIso: string | null;
  sessionEnded: boolean;
  sessionEndedAtIso: string | null;
  trades: { netPnl: number | null }[];
  tradesTaken: number;
  tiltSignals: TiltSignal[];
  lossUsedToday: number;
  lossPct: number | null;
  tradeCountPct: number | null;
  maxLossPlan: number | null;
  maxTradeCountPlan: number | null;
  profitLockPlan: number | null;
  missionLabel: string | null;
  netPnlToday: number;
}

export function LiveSessionCockpit(props: LiveSessionCockpitProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (props.sessionEnded) {
    return (
      <section className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="mb-1 text-sm font-semibold text-foreground">
          Session ended for today.
        </p>
        <p className="mb-4 text-sm text-muted">
          Net P&amp;L {formatCurrency(props.netPnlToday)} · {props.tradesTaken} trades
        </p>
        <Link
          href={`/live-session/recap/${props.dateKey}`}
          className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          View Daily Recap
        </Link>
      </section>
    );
  }

  const lastTradeTime = props.lastTradeTimeIso ? new Date(props.lastTradeTimeIso) : null;
  const cooldown = computeCooldownState({
    lastTradeTime,
    cooldownMinutes: props.cooldownMinutes,
    now,
  });

  const emergencyPauseUntil = props.emergencyPauseUntilIso
    ? new Date(props.emergencyPauseUntilIso)
    : null;
  const emergencyPauseActive = Boolean(
    emergencyPauseUntil && emergencyPauseUntil.getTime() > now.getTime(),
  );
  const emergencyPauseSecondsRemaining = emergencyPauseActive
    ? Math.ceil((emergencyPauseUntil!.getTime() - now.getTime()) / 1000)
    : 0;

  const streaks = computeTradeStreaks(props.trades);
  const consecutiveLossesToday = streaks.currentType === "loss" ? streaks.currentCount : 0;

  const crashout = computeCrashoutMeter({
    tiltSignals: props.tiltSignals,
    consecutiveLossesToday,
    lossPct: props.lossPct,
    tradeCountPct: props.tradeCountPct,
    cooldownActive: cooldown.active,
    emergencyPauseActive,
    emergencyPauseUsedToday: Boolean(props.emergencyPauseUntilIso),
  });

  const permission = canTakeAnotherTrade({
    cooldownActive: cooldown.active,
    emergencyPauseActive,
    sessionEnded: props.sessionEnded,
    maxTradeCountPlan: props.maxTradeCountPlan,
    tradesTakenToday: props.tradesTaken,
    maxLossPlan: props.maxLossPlan,
    lossUsedToday: props.lossUsedToday,
    crashoutState: crashout.state,
  });

  const quickLogDisabled = emergencyPauseActive;
  const quickLogDisabledReason = emergencyPauseActive
    ? "Emergency pause is active — Quick Log is locked until it clears."
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <CooldownCard cooldown={cooldown} />
        <QuickLogPanel
          dateKey={props.dateKey}
          disabled={quickLogDisabled}
          disabledReason={quickLogDisabledReason}
        />
        <EmergencyButton
          dateKey={props.dateKey}
          paused={emergencyPauseActive}
          secondsRemaining={emergencyPauseSecondsRemaining}
          disabled={false}
        />
      </div>
      <div className="flex flex-col gap-4">
        <CrashoutMeterPanel meter={crashout} permission={permission} />
        <TodaysMissionCard
          missionLabel={props.missionLabel}
          maxLossPlan={props.maxLossPlan}
          lossUsedToday={props.lossUsedToday}
          lossPct={props.lossPct}
          maxTradeCountPlan={props.maxTradeCountPlan}
          tradesTaken={props.tradesTaken}
          tradeCountPct={props.tradeCountPct}
          profitLockPlan={props.profitLockPlan}
          netPnlToday={props.netPnlToday}
        />
        <EndSessionFlow
          dateKey={props.dateKey}
          netPnlToday={props.netPnlToday}
          tradesTaken={props.tradesTaken}
          crashoutScore={crashout.score}
        />
      </div>
    </div>
  );
}

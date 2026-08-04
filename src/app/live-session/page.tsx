import { PageHeader } from "@/components/layout/page-header";
import { getLiveSessionData } from "@/lib/data/live-session";
import { LiveSessionCockpit } from "@/components/live-session/live-session-cockpit";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default async function LiveSessionPage() {
  const dateKey = todayKey();
  const data = await getLiveSessionData(dateKey);

  const lastTrade = data.trades[data.trades.length - 1] ?? null;
  const lastTradeTimeIso = lastTrade
    ? (lastTrade.exitTime ?? lastTrade.entryTime).toISOString()
    : null;

  return (
    <div>
      <PageHeader
        title="Live Session"
        description="Your real-time trading-discipline cockpit — keep this open while you trade."
      />
      <LiveSessionCockpit
        dateKey={dateKey}
        cooldownMinutes={data.cooldownMinutes}
        lastTradeTimeIso={lastTradeTimeIso}
        emergencyPauseUntilIso={data.emergencyPauseUntil?.toISOString() ?? null}
        sessionEnded={data.sessionEnded}
        sessionEndedAtIso={data.sessionEndedAt?.toISOString() ?? null}
        trades={data.trades.map((t) => ({ netPnl: t.netPnl }))}
        tradesTaken={data.trades.length}
        tiltSignals={data.tiltSignals}
        lossUsedToday={data.lossUsedToday}
        lossPct={data.lossPct}
        tradeCountPct={data.tradeCountPct}
        maxLossPlan={data.maxLossPlan}
        maxTradeCountPlan={data.maxTradeCountPlan}
        profitLockPlan={data.profitLockPlan}
        missionLabel={data.missionLabel}
        netPnlToday={data.netPnlToday}
      />
    </div>
  );
}

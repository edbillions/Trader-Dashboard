import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getDailyRecapData } from "@/lib/data/daily-recap";
import { formatDateWithWeekday } from "@/lib/pnl";
import { SessionGradeHeader } from "@/components/live-session/recap/session-grade-header";
import { IdentityPingsBadges } from "@/components/live-session/recap/identity-pings-badges";
import { StatsRow } from "@/components/live-session/recap/stats-row";
import { MissionExecutionSection } from "@/components/live-session/recap/mission-execution-section";
import { GreenFlagsSection } from "@/components/live-session/recap/green-flags-section";
import { SessionTimeline } from "@/components/live-session/recap/session-timeline";
import { TradeLogTable } from "@/components/live-session/recap/trade-log-table";
import { BehaviorReviewLists } from "@/components/live-session/recap/behavior-review-lists";
import { TomorrowsFocusMessageCard } from "@/components/live-session/recap/tomorrows-focus-message-card";
import { DebriefForm } from "@/components/live-session/recap/debrief-form";
import { ScorecardPreviewModal } from "@/components/live-session/recap/scorecard-preview-modal";

export default async function DailyRecapPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const recap = await getDailyRecapData(date);

  if (!recap) notFound();

  const dateLabel = formatDateWithWeekday(recap.day.date);
  const positivePings = recap.identityPings.filter((p) => p.positive);

  return (
    <div>
      <PageHeader
        title="Daily Recap"
        description={dateLabel}
        actions={
          <ScorecardPreviewModal
            data={{
              dateLabel,
              grade: recap.grade,
              disciplineScore100: recap.disciplineScore100,
              netPnlToday: recap.netPnlToday,
              tradesTaken: recap.trades.length,
              winRate: recap.winRate,
              identityPings: recap.identityPings,
            }}
          />
        }
      />

      <div className="flex flex-col gap-6">
        <SessionGradeHeader
          grade={recap.grade}
          disciplineScore100={recap.disciplineScore100}
          crashout={recap.crashout}
        />

        <IdentityPingsBadges title="Today's Identity Pings" pings={recap.identityPings} />

        <StatsRow
          netPnlToday={recap.netPnlToday}
          disciplineScore100={recap.disciplineScore100}
          tradesTaken={recap.trades.length}
          winRate={recap.winRate}
        />

        <MissionExecutionSection
          missionLabel={recap.day.missionLabel}
          missionScore={recap.missionScore}
          grade={recap.grade}
          disciplineScore100={recap.disciplineScore100}
          maxTradeCountPlan={recap.day.maxTradeCountPlan}
          tradesTaken={recap.trades.length}
          maxLossPlan={recap.day.maxLossPlan}
          lossUsedToday={recap.lossUsedToday}
        />

        <GreenFlagsSection greenFlags={recap.greenFlags} tiltSignals={recap.tiltSignals} />

        <SessionTimeline trades={recap.trades} sessionEndedAt={recap.day.sessionEndedAt} />

        <TradeLogTable trades={recap.trades} />

        <BehaviorReviewLists review={recap.behaviorReview} />

        {positivePings.length > 0 && (
          <IdentityPingsBadges title="Today You Became" pings={positivePings} />
        )}

        <TomorrowsFocusMessageCard focus={recap.tomorrowsFocus} message={recap.tomorrowMessage} />

        <DebriefForm
          dateKey={recap.dateKey}
          initialImprovement={recap.day.debriefImprovement ?? ""}
          initialFeeling={recap.day.debriefFeeling ?? ""}
        />
      </div>
    </div>
  );
}

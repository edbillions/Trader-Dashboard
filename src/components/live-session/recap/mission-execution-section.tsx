import type { SessionGrade } from "@/lib/domain/session-grade";

export function MissionExecutionSection({
  missionLabel,
  missionScore,
  grade,
  disciplineScore100,
  maxTradeCountPlan,
  tradesTaken,
  maxLossPlan,
  lossUsedToday,
}: {
  missionLabel: string | null;
  missionScore: number;
  grade: SessionGrade;
  disciplineScore100: number;
  maxTradeCountPlan: number | null;
  tradesTaken: number;
  maxLossPlan: number | null;
  lossUsedToday: number;
}) {
  const tradesOk = maxTradeCountPlan == null || tradesTaken <= maxTradeCountPlan;
  const lossOk = maxLossPlan == null || lossUsedToday <= Math.abs(maxLossPlan);

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Today&apos;s Mission</h3>
      <p className="mb-3 text-sm text-muted">
        {missionLabel?.trim() || "Trade the Plan — wait for the A+ setup."}
      </p>
      <p className="mb-4 text-sm">
        Mission score:{" "}
        <span className="font-semibold text-foreground">{missionScore}/10</span>
      </p>

      <ul className="mb-4 flex flex-col gap-1 text-sm">
        <li className={tradesOk ? "text-profit" : "text-loss"}>
          {tradesOk ? "✓" : "✕"} Stayed within max trades
          {maxTradeCountPlan != null ? ` (${tradesTaken}/${maxTradeCountPlan})` : ""}
        </li>
        <li className={lossOk ? "text-profit" : "text-loss"}>
          {lossOk ? "✓" : "✕"} Respected max daily loss
        </li>
      </ul>

      <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-center">
        <div>
          <p className="text-xs text-muted">Grade</p>
          <p className="text-lg font-bold text-foreground">{grade.letter}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Discipline</p>
          <p className="text-lg font-bold text-foreground">{disciplineScore100}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Mission</p>
          <p className="text-lg font-bold text-foreground">{missionScore}/10</p>
        </div>
      </div>
    </section>
  );
}

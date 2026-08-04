import type { SessionGrade } from "@/lib/domain/session-grade";
import type { CrashoutMeterResult } from "@/lib/domain/crashout-meter";
import { SemicircleGauge } from "@/components/live-session/semicircle-gauge";

const GRADE_COLOR: Record<SessionGrade["letter"], string> = {
  A: "text-profit",
  B: "text-accent",
  C: "text-yellow-500",
  D: "text-loss",
};

const STATE_COLOR: Record<CrashoutMeterResult["state"], string> = {
  calm: "text-profit",
  elevated: "text-yellow-500",
  peak: "text-loss",
};

export function SessionGradeHeader({
  grade,
  disciplineScore100,
  crashout,
}: {
  grade: SessionGrade;
  disciplineScore100: number;
  crashout: CrashoutMeterResult;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Session Grade
          </p>
          <p className={`mt-1 text-5xl font-bold ${GRADE_COLOR[grade.letter]}`}>
            {grade.letter}
            <span className="ml-3 text-lg font-medium text-foreground">
              — {grade.tagline}
            </span>
          </p>
          <p className="mt-3 text-sm text-muted">
            Discipline Score{" "}
            <span className="font-semibold text-foreground">
              {disciplineScore100}/100
            </span>
          </p>
          <div className="mt-4 rounded-lg border border-profit/30 bg-profit-muted p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-profit">
              Coach Observation
            </p>
            <p className="mt-1 text-sm text-foreground">
              {grade.letter === "A"
                ? "Every input was on purpose today. Stay there."
                : grade.letter === "B"
                  ? "Solid process with a few slips — review what slipped and tighten it up."
                  : grade.letter === "C"
                    ? "Some real slippage today — the plan existed, execution wandered."
                    : "Today needs a full audit — rewrite the intentions before your next session."}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <SemicircleGauge
            value={crashout.score}
            colorClass={STATE_COLOR[crashout.state]}
            label={crashout.stateLabel}
            sublabel="Discipline Arc"
          />
        </div>
      </div>
    </section>
  );
}

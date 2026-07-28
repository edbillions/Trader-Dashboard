import { prisma } from "@/lib/prisma";
import { computeDayDisciplineScore } from "@/lib/domain/discipline";
import { computeStreak } from "@/lib/domain/streaks";
import { detectTiltSignals, type TiltDayInput } from "@/lib/domain/tilt";

const GOOD_GRADES = new Set(["A+", "A"]);

export async function getCoachData() {
  const days = await prisma.tradingDay.findMany({
    orderBy: { date: "desc" },
    include: {
      ruleViolations: { select: { id: true } },
      trades: {
        select: {
          id: true,
          entryTime: true,
          exitTime: true,
          positionSize: true,
          netPnl: true,
          session: true,
          setupGrade: true,
        },
      },
    },
  });

  const entriesByDate = new Map(
    days.map((d) => [d.date.toISOString().slice(0, 10), d]),
  );

  const journalingStreak = computeStreak(entriesByDate, () => true);
  const planAdherenceStreak = computeStreak(
    entriesByDate,
    (d) => !!d.planAdherenceGrade && GOOD_GRADES.has(d.planAdherenceGrade),
  );
  const zeroViolationStreak = computeStreak(
    entriesByDate,
    (d) => d.ruleViolations.length === 0,
  );
  const cleanSetupStreak = computeStreak(entriesByDate, (d) =>
    d.trades.every((t) => !!t.setupGrade && GOOD_GRADES.has(t.setupGrade)),
  );

  const disciplineHistory = days.slice(0, 14).map((d) => ({
    date: d.date.toISOString().slice(0, 10),
    score: computeDayDisciplineScore({
      planAdherenceGrade: d.planAdherenceGrade,
      maxLossPlan: d.maxLossPlan,
      ruleViolationCount: d.ruleViolations.length,
      trades: d.trades,
    }),
  }));

  const recentScored = days
    .slice(0, 30)
    .map((d) =>
      computeDayDisciplineScore({
        planAdherenceGrade: d.planAdherenceGrade,
        maxLossPlan: d.maxLossPlan,
        ruleViolationCount: d.ruleViolations.length,
        trades: d.trades,
      }),
    )
    .filter((s): s is number => s != null);
  const avgDisciplineScore =
    recentScored.length > 0
      ? recentScored.reduce((a, b) => a + b, 0) / recentScored.length
      : null;

  const tiltSignals = days
    .slice(0, 30)
    .flatMap((d) =>
      detectTiltSignals({
        date: d.date.toISOString().slice(0, 10),
        maxTradeCountPlan: d.maxTradeCountPlan,
        sessionTiming: d.sessionTiming,
        trades: d.trades,
      } satisfies TiltDayInput),
    )
    .slice(0, 20);

  const [goals, processGoals] = await Promise.all([
    prisma.goal.findMany({ orderBy: { periodStart: "desc" } }),
    prisma.processGoal.findMany({ orderBy: { periodStart: "desc" } }),
  ]);

  const dollarGoals = await Promise.all(
    goals.map(async (goal) => {
      const trades = await prisma.trade.findMany({
        where: {
          entryTime: { gte: goal.periodStart, lte: goal.periodEnd },
        },
        select: { netPnl: true },
      });
      const actual = trades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
      return {
        ...goal,
        actual,
        progress: goal.targetAmount !== 0 ? (actual / goal.targetAmount) * 100 : 0,
      };
    }),
  );

  const processGoalResults = processGoals.map((goal) => {
    const periodDays = days.filter(
      (d) => d.date >= goal.periodStart && d.date <= goal.periodEnd,
    );

    let actual = 0;
    if (goal.metric === "journaling_days") {
      actual = periodDays.length;
    } else if (goal.metric === "zero_violation_days") {
      actual = periodDays.filter((d) => d.ruleViolations.length === 0).length;
    } else if (goal.metric === "clean_setup_days") {
      actual = periodDays.filter((d) =>
        d.trades.every(
          (t) => !!t.setupGrade && GOOD_GRADES.has(t.setupGrade),
        ),
      ).length;
    } else if (goal.metric === "discipline_score") {
      const scores = periodDays
        .map((d) =>
          computeDayDisciplineScore({
            planAdherenceGrade: d.planAdherenceGrade,
            maxLossPlan: d.maxLossPlan,
            ruleViolationCount: d.ruleViolations.length,
            trades: d.trades,
          }),
        )
        .filter((s): s is number => s != null);
      actual =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
    }

    return {
      ...goal,
      actual,
      progress: goal.targetValue !== 0 ? (actual / goal.targetValue) * 100 : 0,
    };
  });

  return {
    streaks: {
      journaling: journalingStreak,
      planAdherence: planAdherenceStreak,
      zeroViolation: zeroViolationStreak,
      cleanSetup: cleanSetupStreak,
    },
    avgDisciplineScore,
    disciplineHistory,
    tiltSignals,
    dollarGoals,
    processGoalResults,
  };
}

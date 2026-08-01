import { prisma } from "@/lib/prisma";
import { computeHabitStreak } from "@/lib/domain/habits";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayDateOnly() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getScheduleData(historyDays = 21) {
  const since = todayDateOnly();
  since.setDate(since.getDate() - (historyDays - 1));

  const [habits, logs] = await Promise.all([
    prisma.habit.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.habitLog.findMany({
      where: { date: { gte: since } },
      select: { habitId: true, date: true },
    }),
  ]);

  const logsByHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    const key = dateKey(log.date);
    if (!logsByHabit.has(log.habitId)) logsByHabit.set(log.habitId, new Set());
    logsByHabit.get(log.habitId)!.add(key);
  }

  const todayKey = dateKey(todayDateOnly());

  const habitsWithState = habits.map((habit) => {
    const doneDates = logsByHabit.get(habit.id) ?? new Set<string>();
    return {
      id: habit.id,
      label: habit.label,
      cadence: habit.cadence as "daily" | "weekday",
      doneToday: doneDates.has(todayKey),
      streak: computeHabitStreak(doneDates, habit.cadence as "daily" | "weekday"),
      history: doneDates,
    };
  });

  return { habits: habitsWithState, historyDays };
}

export async function getScheduleWidgetData() {
  const today = todayDateOnly();
  const [habits, todayLogs] = await Promise.all([
    prisma.habit.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, label: true },
    }),
    prisma.habitLog.findMany({
      where: { date: today },
      select: { habitId: true },
    }),
  ]);

  const doneIds = new Set(todayLogs.map((l) => l.habitId));

  return {
    total: habits.length,
    doneCount: habits.filter((h) => doneIds.has(h.id)).length,
  };
}

export async function listAllHabits() {
  return prisma.habit.findMany({ orderBy: { order: "asc" } });
}

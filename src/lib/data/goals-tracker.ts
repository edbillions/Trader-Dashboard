import { prisma } from "@/lib/prisma";

export async function listLifeGoals() {
  return prisma.lifeGoal.findMany({
    orderBy: [{ isPrimary: "desc" }, { achieved: "asc" }, { createdAt: "desc" }],
  });
}

export function goalProgress(goal: {
  targetValue: number | null;
  currentValue: number;
  direction: string;
}): number | null {
  if (goal.targetValue == null || goal.targetValue === 0) return null;
  const pct = (goal.currentValue / goal.targetValue) * 100;
  return Math.min(100, Math.max(0, pct));
}

export type GoalStatus = "active" | "completed" | "failed";

export function goalStatus(goal: {
  achieved: boolean;
  targetDate: Date | null;
}): GoalStatus {
  if (goal.achieved) return "completed";
  if (goal.targetDate && goal.targetDate < new Date()) return "failed";
  return "active";
}

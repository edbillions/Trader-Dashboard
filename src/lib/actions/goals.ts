"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function requiredNumber(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value)) {
    throw new Error(`${key} must be a number`);
  }
  return value;
}

function requiredDate(formData: FormData, key: string): Date {
  return new Date(`${requiredString(formData, key)}T00:00:00`);
}

export async function createGoalAction(formData: FormData) {
  const tier = requiredString(formData, "tier");
  const targetAmount = requiredNumber(formData, "targetAmount");
  const periodStart = requiredDate(formData, "periodStart");
  const periodEnd = requiredDate(formData, "periodEnd");

  await prisma.goal.create({
    data: { tier, targetAmount, periodStart, periodEnd },
  });

  revalidatePath("/coach");
}

export async function deleteGoalAction(formData: FormData) {
  const id = requiredString(formData, "id");
  await prisma.goal.delete({ where: { id } });
  revalidatePath("/coach");
}

export async function createProcessGoalAction(formData: FormData) {
  const label = requiredString(formData, "label");
  const metric = requiredString(formData, "metric");
  const targetValue = requiredNumber(formData, "targetValue");
  const periodStart = requiredDate(formData, "periodStart");
  const periodEnd = requiredDate(formData, "periodEnd");

  await prisma.processGoal.create({
    data: { label, metric, targetValue, periodStart, periodEnd },
  });

  revalidatePath("/coach");
}

export async function deleteProcessGoalAction(formData: FormData) {
  const id = requiredString(formData, "id");
  await prisma.processGoal.delete({ where: { id } });
  revalidatePath("/coach");
}

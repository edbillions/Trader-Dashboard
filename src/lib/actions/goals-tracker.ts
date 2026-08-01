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

export async function createLifeGoalAction(formData: FormData) {
  const category = requiredString(formData, "category");
  const tier = formData.get("tier");
  const title = requiredString(formData, "title");
  const description = formData.get("description");
  const targetValue = formData.get("targetValue");
  const unit = formData.get("unit");
  const direction = formData.get("direction");
  const targetDate = formData.get("targetDate");
  const isPrimary = formData.get("isPrimary") === "true";

  if (isPrimary) {
    await prisma.lifeGoal.updateMany({
      data: { isPrimary: false },
      where: { isPrimary: true },
    });
  }

  await prisma.lifeGoal.create({
    data: {
      category,
      tier: typeof tier === "string" && tier.trim() ? tier.trim() : null,
      title,
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
      targetValue:
        typeof targetValue === "string" && targetValue !== ""
          ? Number(targetValue)
          : null,
      unit: typeof unit === "string" && unit.trim() ? unit.trim() : null,
      direction: direction === "limit" ? "limit" : "increase",
      targetDate:
        typeof targetDate === "string" && targetDate
          ? new Date(`${targetDate}T00:00:00`)
          : null,
      isPrimary,
    },
  });

  revalidatePath("/goals");
}

export async function updateProgressAction(formData: FormData) {
  const id = requiredString(formData, "id");
  const currentValue = Number(formData.get("currentValue"));
  if (!Number.isFinite(currentValue)) {
    throw new Error("currentValue must be a number");
  }

  await prisma.lifeGoal.update({
    where: { id },
    data: { currentValue },
  });

  revalidatePath("/goals");
}

export async function toggleAchievedAction(formData: FormData) {
  const id = requiredString(formData, "id");
  const achieved = formData.get("achieved") === "true";

  await prisma.lifeGoal.update({
    where: { id },
    data: { achieved: !achieved },
  });

  revalidatePath("/goals");
}

export async function setPrimaryGoalAction(formData: FormData) {
  const id = requiredString(formData, "id");

  await prisma.$transaction([
    prisma.lifeGoal.updateMany({
      data: { isPrimary: false },
      where: { isPrimary: true },
    }),
    prisma.lifeGoal.update({
      where: { id },
      data: { isPrimary: true },
    }),
  ]);

  revalidatePath("/goals");
}

export async function deleteLifeGoalAction(formData: FormData) {
  const id = requiredString(formData, "id");
  await prisma.lifeGoal.delete({ where: { id } });
  revalidatePath("/goals");
}

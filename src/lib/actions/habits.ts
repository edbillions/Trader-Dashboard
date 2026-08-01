"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required field: ${key}`);
  }
  return value.trim();
}

export async function createHabitAction(formData: FormData) {
  const label = requiredString(formData, "label");
  const cadenceRaw = formData.get("cadence");
  const cadence = cadenceRaw === "weekday" ? "weekday" : "daily";
  const count = await prisma.habit.count();

  await prisma.habit.create({
    data: { label, cadence, order: count },
  });

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

export async function toggleHabitActiveAction(formData: FormData) {
  const id = requiredString(formData, "id");
  const active = formData.get("active") === "true";

  await prisma.habit.update({ where: { id }, data: { active } });

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

export async function deleteHabitAction(formData: FormData) {
  const id = requiredString(formData, "id");

  await prisma.habit.delete({ where: { id } });

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

export async function toggleHabitLogAction(formData: FormData) {
  const habitId = requiredString(formData, "habitId");
  const date = requiredString(formData, "date");
  const done = formData.get("done") === "true";
  const dateOnly = new Date(`${date}T00:00:00`);

  if (done) {
    await prisma.habitLog.deleteMany({ where: { habitId, date: dateOnly } });
  } else {
    await prisma.habitLog.upsert({
      where: { habitId_date: { habitId, date: dateOnly } },
      update: {},
      create: { habitId, date: dateOnly },
    });
  }

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

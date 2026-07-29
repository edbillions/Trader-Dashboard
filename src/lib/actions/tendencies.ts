"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scanTendencies } from "@/lib/ai/tendencies";

export async function createTendencyAction(formData: FormData) {
  const title = formData.get("title");
  const description = formData.get("description");
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Title is required");
  }

  await prisma.tendency.create({
    data: {
      title: title.trim(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
    },
  });

  revalidatePath("/tendencies");
}

export async function updateTendencyStatusAction(formData: FormData) {
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || typeof status !== "string") {
    throw new Error("Missing tendency id or status");
  }

  await prisma.tendency.update({ where: { id }, data: { status } });
  revalidatePath("/tendencies");
}

export async function deleteTendencyAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("Missing tendency id");
  }

  await prisma.tendency.delete({ where: { id } });
  revalidatePath("/tendencies");
}

export async function scanTendenciesAction() {
  const result = await scanTendencies();
  if (result == null) {
    return { available: false as const, matches: [], candidates: [] };
  }
  return { available: true as const, ...result };
}

export async function applyTendencyMatchesAction(formData: FormData) {
  const idsRaw = formData.get("ids");
  if (typeof idsRaw !== "string" || !idsRaw) return;
  const ids = idsRaw.split(",").filter(Boolean);
  if (ids.length === 0) return;

  await prisma.tendency.updateMany({
    where: { id: { in: ids } },
    data: { seenCount: { increment: 1 }, lastSeenAt: new Date() },
  });

  revalidatePath("/tendencies");
}

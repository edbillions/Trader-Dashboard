"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function saveNotebookEntryAction(date: string, content: string) {
  const dateOnly = new Date(`${date}T00:00:00`);
  await prisma.notebookEntry.upsert({
    where: { date: dateOnly },
    create: { date: dateOnly, content },
    update: { content },
  });
  revalidatePath("/notebook");
}

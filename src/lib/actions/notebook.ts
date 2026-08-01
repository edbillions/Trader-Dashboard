"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// ---------- Notebook folders ----------

export async function createNotebookFolderAction(formData: FormData) {
  const name = formData.get("name");
  const color = formData.get("color");
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Folder name is required");
  }
  const count = await prisma.notebookFolder.count();
  const folder = await prisma.notebookFolder.create({
    data: {
      name: name.trim(),
      color: typeof color === "string" && color ? color : null,
      order: count,
    },
  });
  revalidatePath("/notebook");
  redirect(`/notebook?folder=${folder.id}`);
}

export async function deleteNotebookFolderAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("Missing folder id");
  await prisma.notebookFolder.delete({ where: { id } }); // cascades to notes
  revalidatePath("/notebook");
  redirect("/notebook");
}

export async function createNotebookNoteAction(formData: FormData) {
  const folderId = formData.get("folderId");
  if (typeof folderId !== "string") throw new Error("Missing folder id");
  const note = await prisma.notebookNote.create({
    data: { folderId, title: "Untitled", content: "" },
  });
  revalidatePath("/notebook");
  redirect(`/notebook?folder=${folderId}&note=${note.id}`);
}

// Plain-arg (not FormData) — called repeatedly from the client editor's
// debounced autosave via useTransition, mirroring toggleTradeReviewedAction's
// split from the FormData-based actions above (which are real <form> submits).
export async function saveNotebookNoteAction(
  id: string,
  title: string,
  content: string,
): Promise<void> {
  await prisma.notebookNote.update({ where: { id }, data: { title, content } });
  revalidatePath("/notebook");
}

export async function deleteNotebookNoteAction(formData: FormData) {
  const id = formData.get("id");
  const folderId = formData.get("folderId");
  if (typeof id !== "string" || typeof folderId !== "string") {
    throw new Error("Missing note id/folder id");
  }
  await prisma.notebookNote.delete({ where: { id } });
  revalidatePath("/notebook");
  redirect(`/notebook?folder=${folderId}`);
}

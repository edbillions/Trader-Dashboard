"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createTodoAction(formData: FormData) {
  const title = formData.get("title");
  const notes = formData.get("notes");
  const dueDate = formData.get("dueDate");
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Title is required");
  }

  await prisma.todoItem.create({
    data: {
      title: title.trim(),
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      dueDate:
        typeof dueDate === "string" && dueDate
          ? new Date(`${dueDate}T00:00:00`)
          : null,
    },
  });

  revalidatePath("/todo");
}

export async function toggleTodoAction(formData: FormData) {
  const id = formData.get("id");
  const completed = formData.get("completed") === "true";
  if (typeof id !== "string") {
    throw new Error("Missing todo id");
  }

  await prisma.todoItem.update({
    where: { id },
    data: {
      completed: !completed,
      completedAt: !completed ? new Date() : null,
    },
  });

  revalidatePath("/todo");
}

export async function deleteTodoAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("Missing todo id");
  }

  await prisma.todoItem.delete({ where: { id } });
  revalidatePath("/todo");
}

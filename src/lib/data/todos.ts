import { prisma } from "@/lib/prisma";

export async function listTodos() {
  return prisma.todoItem.findMany({
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
}

export async function getTodosForMonth(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return prisma.todoItem.findMany({
    where: { dueDate: { gte: start, lt: end } },
    orderBy: { dueDate: "asc" },
  });
}

"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function addChartImageAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("An image is required");
  }

  const title = formData.get("title");
  const symbol = formData.get("symbol");
  const grade = formData.get("grade");
  const notes = formData.get("notes");

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".png";
  const filename = `${randomUUID()}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "gallery");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), bytes);

  await prisma.chartImage.create({
    data: {
      filePath: `/uploads/gallery/${filename}`,
      title: typeof title === "string" && title.trim() ? title.trim() : null,
      symbol:
        typeof symbol === "string" && symbol.trim()
          ? symbol.trim().toUpperCase()
          : null,
      grade: typeof grade === "string" && grade ? grade : null,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
  });

  revalidatePath("/chart-vault");
}

export async function deleteChartImageAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("Missing chart image id");
  }

  await prisma.chartImage.delete({ where: { id } });
  revalidatePath("/chart-vault");
}

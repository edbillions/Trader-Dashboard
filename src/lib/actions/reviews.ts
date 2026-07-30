"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function requiredStartDate(formData: FormData, key: string): Date {
  return new Date(`${requiredString(formData, key)}T00:00:00`);
}

// periodEnd must be end-of-day so trades occurring on that calendar date
// (and the auto-draft's exact-datetime dedupe check) both stay correct.
function requiredEndDate(formData: FormData, key: string): Date {
  return new Date(`${requiredString(formData, key)}T23:59:59.999`);
}

function optionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalRating(formData: FormData): number | null {
  const value = formData.get("rating");
  if (typeof value !== "string" || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createReviewAction(formData: FormData) {
  const title = requiredString(formData, "title");
  const periodStart = requiredStartDate(formData, "periodStart");
  const periodEnd = requiredEndDate(formData, "periodEnd");

  const review = await prisma.periodReview.create({
    data: {
      title,
      periodStart,
      periodEnd,
      category: optionalString(formData, "category"),
      rating: optionalRating(formData),
      notes: optionalString(formData, "notes"),
      isDraft: false,
    },
  });

  revalidatePath("/reviews");
  redirect(`/reviews/${review.id}`);
}

export async function updateReviewAction(formData: FormData) {
  const id = requiredString(formData, "id");
  const title = requiredString(formData, "title");
  const periodStart = requiredStartDate(formData, "periodStart");
  const periodEnd = requiredEndDate(formData, "periodEnd");

  await prisma.periodReview.update({
    where: { id },
    data: {
      title,
      periodStart,
      periodEnd,
      category: optionalString(formData, "category"),
      rating: optionalRating(formData),
      notes: optionalString(formData, "notes"),
      isDraft: false,
    },
  });

  revalidatePath("/reviews");
  revalidatePath(`/reviews/${id}`);
}

export async function deleteReviewAction(formData: FormData) {
  const id = requiredString(formData, "id");
  await prisma.periodReview.delete({ where: { id } });
  revalidatePath("/reviews");
  redirect("/reviews");
}

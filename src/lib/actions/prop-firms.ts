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

function requiredNumber(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value)) {
    throw new Error(`${key} must be a number`);
  }
  return value;
}

export async function createAccountAction(formData: FormData) {
  const firmName = requiredString(formData, "firmName");
  const accountName = requiredString(formData, "accountName");
  const accountType = requiredString(formData, "accountType");

  const account = await prisma.propFirmAccount.create({
    data: { firmName, accountName, accountType },
  });

  revalidatePath("/prop-firms");
  redirect(`/prop-firms/${account.id}`);
}

export async function updateAccountStatusAction(formData: FormData) {
  const accountId = requiredString(formData, "accountId");
  const status = requiredString(formData, "status");

  await prisma.propFirmAccount.update({
    where: { id: accountId },
    data: { status },
  });

  revalidatePath("/prop-firms");
  revalidatePath(`/prop-firms/${accountId}`);
}

export async function addExpenseAction(formData: FormData) {
  const accountId = requiredString(formData, "accountId");
  const kind = requiredString(formData, "kind");
  const amount = requiredNumber(formData, "amount");
  const dateStr = requiredString(formData, "date");
  const note = formData.get("note");

  await prisma.accountExpense.create({
    data: {
      accountId,
      kind,
      amount,
      date: new Date(`${dateStr}T00:00:00`),
      note: typeof note === "string" && note.trim() ? note.trim() : null,
    },
  });

  revalidatePath("/prop-firms");
  revalidatePath(`/prop-firms/${accountId}`);
}

export async function addPayoutAction(formData: FormData) {
  const accountId = requiredString(formData, "accountId");
  const amount = requiredNumber(formData, "amount");
  const dateStr = requiredString(formData, "date");
  const note = formData.get("note");

  await prisma.accountPayout.create({
    data: {
      accountId,
      amount,
      date: new Date(`${dateStr}T00:00:00`),
      note: typeof note === "string" && note.trim() ? note.trim() : null,
    },
  });

  revalidatePath("/prop-firms");
  revalidatePath(`/prop-firms/${accountId}`);
}

export async function deleteExpenseAction(formData: FormData) {
  const id = requiredString(formData, "id");
  const accountId = requiredString(formData, "accountId");
  await prisma.accountExpense.delete({ where: { id } });
  revalidatePath("/prop-firms");
  revalidatePath(`/prop-firms/${accountId}`);
}

export async function deletePayoutAction(formData: FormData) {
  const id = requiredString(formData, "id");
  const accountId = requiredString(formData, "accountId");
  await prisma.accountPayout.delete({ where: { id } });
  revalidatePath("/prop-firms");
  revalidatePath(`/prop-firms/${accountId}`);
}

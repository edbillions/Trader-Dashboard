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

export async function updateSettingsAction(formData: FormData) {
  const timezone = requiredString(formData, "timezone");
  const apiKeyRaw = formData.get("anthropicApiKey");
  const anthropicApiKey =
    typeof apiKeyRaw === "string" && apiKeyRaw.trim() ? apiKeyRaw.trim() : null;
  const cooldownRaw = formData.get("cooldownMinutes");
  const cooldownMinutes =
    typeof cooldownRaw === "string" && cooldownRaw.trim() && Number.isFinite(Number(cooldownRaw))
      ? Math.max(0, Math.round(Number(cooldownRaw)))
      : 5;

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { timezone, cooldownMinutes, ...(anthropicApiKey ? { anthropicApiKey } : {}) },
    create: { id: 1, timezone, anthropicApiKey, cooldownMinutes },
  });

  revalidatePath("/settings");
  revalidatePath("/live-session");
}

export async function clearApiKeyAction() {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { anthropicApiKey: null },
    create: { id: 1, anthropicApiKey: null },
  });
  revalidatePath("/settings");
}

type LookupModel =
  | "entryModel"
  | "confluenceFactor"
  | "tradeSession"
  | "mistakeType"
  | "ruleViolationChecklistItem";

async function createLookupItem(model: LookupModel, label: string) {
  // @ts-expect-error -- dynamic model access, all five share {label, active}
  await prisma[model].create({ data: { label } });
  revalidatePath("/settings");
}

async function toggleLookupActive(
  model: LookupModel,
  id: string,
  active: boolean,
) {
  // @ts-expect-error -- dynamic model access, all five share {label, active}
  await prisma[model].update({ where: { id }, data: { active } });
  revalidatePath("/settings");
}

function labelFrom(formData: FormData) {
  return requiredString(formData, "label");
}

function idFrom(formData: FormData) {
  return requiredString(formData, "id");
}

function activeFrom(formData: FormData) {
  return requiredString(formData, "active") === "true";
}

export async function createEntryModelAction(formData: FormData) {
  await createLookupItem("entryModel", labelFrom(formData));
}
export async function toggleEntryModelAction(formData: FormData) {
  await toggleLookupActive("entryModel", idFrom(formData), activeFrom(formData));
}

export async function createConfluenceFactorAction(formData: FormData) {
  await createLookupItem("confluenceFactor", labelFrom(formData));
}
export async function toggleConfluenceFactorAction(formData: FormData) {
  await toggleLookupActive(
    "confluenceFactor",
    idFrom(formData),
    activeFrom(formData),
  );
}

export async function createTradeSessionAction(formData: FormData) {
  await createLookupItem("tradeSession", labelFrom(formData));
}
export async function toggleTradeSessionAction(formData: FormData) {
  await toggleLookupActive(
    "tradeSession",
    idFrom(formData),
    activeFrom(formData),
  );
}

export async function createMistakeTypeAction(formData: FormData) {
  await createLookupItem("mistakeType", labelFrom(formData));
}
export async function toggleMistakeTypeAction(formData: FormData) {
  await toggleLookupActive(
    "mistakeType",
    idFrom(formData),
    activeFrom(formData),
  );
}

export async function createRuleViolationAction(formData: FormData) {
  await createLookupItem("ruleViolationChecklistItem", labelFrom(formData));
}
export async function toggleRuleViolationAction(formData: FormData) {
  await toggleLookupActive(
    "ruleViolationChecklistItem",
    idFrom(formData),
    activeFrom(formData),
  );
}

export async function createInstrumentAction(formData: FormData) {
  const symbol = requiredString(formData, "symbol").toUpperCase();
  const tickValue = Number(formData.get("tickValue"));
  const tickSize = Number(formData.get("tickSize"));
  const pointValueRaw = formData.get("pointValue");
  const pointValue =
    typeof pointValueRaw === "string" && pointValueRaw.trim()
      ? Number(pointValueRaw)
      : null;

  if (!Number.isFinite(tickValue) || !Number.isFinite(tickSize)) {
    throw new Error("Tick value and tick size must be numbers");
  }

  await prisma.instrumentConfig.upsert({
    where: { symbol },
    update: { tickValue, tickSize, pointValue },
    create: { symbol, tickValue, tickSize, pointValue },
  });

  revalidatePath("/settings");
}

export async function deleteInstrumentAction(formData: FormData) {
  const id = idFrom(formData);
  await prisma.instrumentConfig.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function createTagCategoryAction(formData: FormData) {
  const name = requiredString(formData, "name");
  const count = await prisma.tagCategory.count();
  await prisma.tagCategory.create({ data: { name, order: count } });
  revalidatePath("/settings");
}

export async function toggleTagCategoryActiveAction(formData: FormData) {
  const id = idFrom(formData);
  const active = activeFrom(formData);
  await prisma.tagCategory.update({ where: { id }, data: { active } });
  revalidatePath("/settings");
}

export async function createTagOptionAction(formData: FormData) {
  const categoryId = requiredString(formData, "categoryId");
  const label = requiredString(formData, "label");
  const sentiment = requiredString(formData, "sentiment");
  await prisma.tagOption.create({ data: { categoryId, label, sentiment } });
  revalidatePath("/settings");
}

export async function toggleTagOptionActiveAction(formData: FormData) {
  const id = idFrom(formData);
  const active = activeFrom(formData);
  await prisma.tagOption.update({ where: { id }, data: { active } });
  revalidatePath("/settings");
}

export async function saveTradingViewLayoutAction(formData: FormData) {
  const instrument = requiredString(formData, "instrument").toUpperCase();
  const timeframe = requiredString(formData, "timeframe");
  const url = requiredString(formData, "url");

  await prisma.tradingViewLayout.upsert({
    where: { instrument_timeframe: { instrument, timeframe } },
    update: { url },
    create: { instrument, timeframe, url },
  });

  revalidatePath("/settings");
}

export async function deleteTradingViewLayoutAction(formData: FormData) {
  const id = idFrom(formData);
  await prisma.tradingViewLayout.delete({ where: { id } });
  revalidatePath("/settings");
}

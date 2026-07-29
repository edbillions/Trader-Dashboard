import { prisma } from "@/lib/prisma";

const entryModels = ["Unicorn Model"];

const confluenceFactors = [
  "Bias",
  "Clear Draw on Liquidity (DOL)",
  "Liquidity Sweep",
  "HTF Delivery from FVG",
  "Premium/Discount",
  "Breaker Block w/ Displacement",
  "Macro Time",
];

const sessions = [
  "Asia",
  "London Killzone",
  "NY AM / Silver Bullet",
  "NY Lunch",
  "NY PM",
];

const mistakeTypes = [
  "Entered early",
  "Moved stop",
  "Oversized",
  "Chased price",
  "Revenge trade",
  "Ignored bias",
];

const ruleViolations = [
  "No trading outside planned killzone",
  "No sizing up after a loss",
  "Respected max trade count",
  "No revenge entries",
  "Stopped at planned max loss",
];

const instruments = [
  { symbol: "ES", tickValue: 12.5, tickSize: 0.25, pointValue: 50 },
  { symbol: "NQ", tickValue: 5, tickSize: 0.25, pointValue: 20 },
  { symbol: "YM", tickValue: 5, tickSize: 1, pointValue: 5 },
  { symbol: "MES", tickValue: 1.25, tickSize: 0.25, pointValue: 5 },
  { symbol: "MNQ", tickValue: 0.5, tickSize: 0.25, pointValue: 2 },
];

async function main() {
  for (const label of entryModels) {
    await prisma.entryModel.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }

  for (const label of confluenceFactors) {
    await prisma.confluenceFactor.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }

  for (const label of sessions) {
    await prisma.tradeSession.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }

  for (const label of mistakeTypes) {
    await prisma.mistakeType.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }

  for (const label of ruleViolations) {
    await prisma.ruleViolationChecklistItem.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }

  for (const instrument of instruments) {
    await prisma.instrumentConfig.upsert({
      where: { symbol: instrument.symbol },
      update: {},
      create: instrument,
    });
  }

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

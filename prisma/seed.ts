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

const habits: { label: string; cadence: "daily" | "weekday"; order: number }[] = [
  { label: "Up by 5:15 AM + prayer/gratitude", cadence: "daily", order: 1 },
  { label: "Completed today's workout", cadence: "daily", order: 2 },
  { label: "Coffee with wife", cadence: "daily", order: 3 },
  { label: "Pre-market prep (no YouTube/social)", cadence: "weekday", order: 4 },
  { label: "Traded the plan, no revenge trades", cadence: "weekday", order: 5 },
  { label: "Journaled trades", cadence: "weekday", order: 6 },
  { label: "Homeschool complete", cadence: "weekday", order: 7 },
  { label: "60+ min outdoor time with son", cadence: "daily", order: 8 },
  { label: "Wife time, phones away", cadence: "daily", order: 9 },
  { label: "Lights out by 10 PM", cadence: "daily", order: 10 },
];

const instruments = [
  { symbol: "ES", tickValue: 12.5, tickSize: 0.25, pointValue: 50 },
  { symbol: "NQ", tickValue: 5, tickSize: 0.25, pointValue: 20 },
  { symbol: "YM", tickValue: 5, tickSize: 1, pointValue: 5 },
  { symbol: "MES", tickValue: 1.25, tickSize: 0.25, pointValue: 5 },
  { symbol: "MNQ", tickValue: 0.5, tickSize: 0.25, pointValue: 2 },
];

const tagCategories: {
  name: string;
  order: number;
  tags: { label: string; sentiment: "positive" | "neutral" | "negative" }[];
}[] = [
  {
    name: "Entry Comment",
    order: 1,
    tags: [
      { label: "Perfect entry", sentiment: "positive" },
      { label: "Too early", sentiment: "negative" },
      { label: "Too late", sentiment: "negative" },
      { label: "Impulsive", sentiment: "negative" },
      { label: "Revenge trading", sentiment: "negative" },
      { label: "Unsure", sentiment: "neutral" },
    ],
  },
  {
    name: "Exit Comment",
    order: 2,
    tags: [
      { label: "All rules", sentiment: "positive" },
      { label: "Scaled out", sentiment: "neutral" },
      { label: "End of day", sentiment: "neutral" },
      { label: "Scared - early", sentiment: "negative" },
      { label: "Greedy - too late", sentiment: "negative" },
      { label: "Mistake", sentiment: "negative" },
    ],
  },
  {
    name: "Trade Management",
    order: 3,
    tags: [
      { label: "Managed well", sentiment: "positive" },
      { label: "No management", sentiment: "neutral" },
      { label: "SL too close", sentiment: "negative" },
      { label: "Mistake", sentiment: "negative" },
    ],
  },
  {
    name: "Emotional State",
    order: 4,
    tags: [
      { label: "Calm & focused", sentiment: "positive" },
      { label: "Anxious/rushed", sentiment: "negative" },
      { label: "Frustrated after a loss", sentiment: "negative" },
      { label: "Overconfident after a win", sentiment: "negative" },
      { label: "Fatigued", sentiment: "negative" },
      { label: "FOMO", sentiment: "negative" },
    ],
  },
  {
    name: "Decision Confidence",
    order: 5,
    tags: [
      { label: "High conviction (obvious A+)", sentiment: "positive" },
      { label: "Hesitant entry", sentiment: "negative" },
      { label: "Forced/uncertain setup", sentiment: "negative" },
      { label: "Chased without full confirmation", sentiment: "negative" },
    ],
  },
  {
    name: "Behavioral Consistency",
    order: 6,
    tags: [
      { label: "Followed plan exactly", sentiment: "positive" },
      { label: "Walked away after rule breach", sentiment: "positive" },
      { label: "Deviated from plan", sentiment: "negative" },
      { label: "Revenge re-entry", sentiment: "negative" },
      { label: "Sized up impulsively", sentiment: "negative" },
    ],
  },
  {
    name: "Missed Trade Reason",
    order: 7,
    tags: [
      { label: "Hesitated on valid setup", sentiment: "negative" },
      { label: "Was in another trade/copier lag", sentiment: "neutral" },
      { label: "Away from desk", sentiment: "neutral" },
      { label: "Second-guessed signal", sentiment: "negative" },
      { label: "Didn't meet full checklist", sentiment: "neutral" },
    ],
  },
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

  for (const habit of habits) {
    await prisma.habit.upsert({
      where: { label: habit.label },
      update: { cadence: habit.cadence, order: habit.order },
      create: habit,
    });
  }

  for (const category of tagCategories) {
    const created = await prisma.tagCategory.upsert({
      where: { name: category.name },
      update: { order: category.order },
      create: { name: category.name, order: category.order },
    });

    for (const tag of category.tags) {
      await prisma.tagOption.upsert({
        where: {
          categoryId_label: { categoryId: created.id, label: tag.label },
        },
        update: { sentiment: tag.sentiment },
        create: {
          categoryId: created.id,
          label: tag.label,
          sentiment: tag.sentiment,
        },
      });
    }
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

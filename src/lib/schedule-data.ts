import type { ScheduleBlock } from "@/lib/domain/habits";

// Fixed personal content from the user's daily schedule — not
// database-editable in v1 (they asked for a display + habit tracker, not a
// schedule editor). Times are minutes since midnight.
export const WEEKDAY_SCHEDULE: ScheduleBlock[] = [
  { start: 315, end: 345, label: "Wake up", note: "Hydrate, prayer & gratitude, review daily goals, light mobility." },
  { start: 345, end: 405, label: "Workout" },
  { start: 405, end: 435, label: "Shower & breakfast", note: "Protein-rich breakfast." },
  { start: 435, end: 480, label: "Coffee with wife", note: "Non-negotiable." },
  { start: 480, end: 510, label: "Pre-market prep", note: "Review overnight action, mark HTF liquidity, build daily bias, journal. No YouTube, no social media." },
  { start: 510, end: 660, label: "Trade NY session", note: "This is work — no homeschool, no chores, no errands." },
  { start: 660, end: 690, label: "Connect with your son", note: "He wakes up — breakfast/lunch together, talk about the day, no iPad yet." },
  { start: 690, end: 720, label: "Shut down & journal trades", note: "Clean up, journal, no chart-watching after." },
  { start: 720, end: 840, label: "Homeschool: Math & Language Arts" },
  { start: 840, end: 870, label: "Lunch together", note: "No screens." },
  { start: 870, end: 930, label: "Homeschool: Science + workbook" },
  { start: 930, end: 1020, label: "Outdoor time with son", note: "Basketball, soccer, bike rides, nature walks, swimming — 60-90 min." },
  { start: 1020, end: 1080, label: "Dinner", note: "Cook together." },
  { start: 1080, end: 1170, label: "Family time", note: "Board games, reading, walk, occasional movie night, devotional." },
  { start: 1170, end: 1215, label: "Son's bedtime routine", note: "Wind down, reading." },
  { start: 1215, end: 1290, label: "Wife time", note: "Phones away, talk, walk. Date night once a week if possible." },
  { start: 1290, end: 1320, label: "Prep for tomorrow", note: "Lay out workout clothes, review calendar, journal, read." },
  { start: 1320, end: 1440, label: "Lights out", note: "Asleep by 10 PM — ~7 hours before the 5:15 AM wake-up." },
];

// 0 = Sunday ... 6 = Saturday, matching Date.getDay()
export const FITNESS_SPLIT: Record<number, string> = {
  0: "Recovery walk & stretching",
  1: "Upper body dumbbells + easy 2-3 mile run",
  2: "Insanity Max",
  3: "Lower body dumbbells + recovery run",
  4: "Speed or tempo run",
  5: "Insanity Max (or recovery if needed)",
  6: "Long run (building to 10-12 miles)",
};

export const WEEKEND_RHYTHM: Record<"saturday" | "sunday", string[]> = {
  saturday: ["Long run", "Family outing", "Meal prep"],
  sunday: [
    "Recovery — walk, stretch, mobility",
    "Church or reflection, if that's part of your routine",
    "Weekly trading review",
    "Plan the upcoming week",
  ],
};

export const PRIORITIES: string[] = [
  "Grow your trading income.",
  "Get back to your playing weight of 203 lbs while preparing for your half marathon.",
  "Give your son a great homeschool experience and a more active childhood.",
  "Invest in your marriage every day.",
];

// Merges the fixed weekday schedule with that day's fitness-split workout
// label. Returns null for Sat/Sun — the source schedule has no fixed times
// for weekends, just the looser WEEKEND_RHYTHM bullets.
export function getTodayScheduleBlocks(weekday: number): ScheduleBlock[] | null {
  if (weekday === 0 || weekday === 6) return null;
  return WEEKDAY_SCHEDULE.map((block) =>
    block.label === "Workout"
      ? { ...block, note: FITNESS_SPLIT[weekday] }
      : block,
  );
}

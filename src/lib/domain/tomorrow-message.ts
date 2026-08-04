// Live Session Daily Recap: "Message to tomorrow" — a deterministic quote
// pick, framed at the trader's future self. Kept separate from
// src/lib/motivational-quotes.ts (a different, generic pool used elsewhere)
// since these are explicitly second-person "to tomorrow" messages, gated
// on whether today was a disciplined day or a rough one.

const DISCIPLINED_DAY_MESSAGES = [
  "Protect this version of yourself.",
  "You showed up as the trader you said you wanted to be. Stay there.",
  "This is who you are now. Don't negotiate it away.",
  "Repeat this, not the P&L.",
  "The process worked today. Trust it again tomorrow.",
];

const ROUGH_DAY_MESSAGES = [
  "Today doesn't define you. Tomorrow's plan does.",
  "Reset. The next trade doesn't know about the last one.",
  "You caught it — that's the win. Carry the lesson, not the tilt.",
  "One rough day isn't a pattern until you let it repeat.",
  "Come back to the plan, not the feeling.",
];

export interface TomorrowMessageInput {
  netPnlToday: number;
  hadSevereTiltSignal: boolean;
  date?: Date;
}

function dayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
}

export function pickTomorrowMessage(input: TomorrowMessageInput): string {
  const rough = input.hadSevereTiltSignal || input.netPnlToday < 0;
  const pool = rough ? ROUGH_DAY_MESSAGES : DISCIPLINED_DAY_MESSAGES;
  const index = dayOfYear(input.date ?? new Date()) % pool.length;
  return pool[index];
}

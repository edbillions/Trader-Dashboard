"use server";

import { generateCoachScorecard } from "@/lib/ai/coach-scorecard";
import { getCoachScorecardInput } from "@/lib/data/coach-scorecard-data";

export async function generateCoachScorecardAction() {
  const input = await getCoachScorecardInput();
  const categories = await generateCoachScorecard(input);
  if (categories == null) {
    return { available: false as const, categories: [] };
  }
  return { available: true as const, categories };
}

"use server";

import { generateCoachScorecard } from "@/lib/ai/coach-scorecard";
import { getCoachScorecardInput } from "@/lib/data/coach-scorecard-data";
import { generateDecisionIntelligence } from "@/lib/ai/decision-intelligence";
import { getDecisionIntelligenceInput } from "@/lib/data/decision-intelligence-data";

export async function generateCoachScorecardAction() {
  const input = await getCoachScorecardInput();
  const categories = await generateCoachScorecard(input);
  if (categories == null) {
    return { available: false as const, categories: [] };
  }
  return { available: true as const, categories };
}

export async function generateDecisionIntelligenceAction() {
  const input = await getDecisionIntelligenceInput();
  const result = await generateDecisionIntelligence(input);
  if (result == null) {
    return { available: false as const, result: null };
  }
  return { available: true as const, result };
}

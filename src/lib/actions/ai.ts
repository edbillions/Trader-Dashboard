"use server";

import { formatWizardDayForAI } from "@/lib/ai/format-wizard-day";
import { suggestRuleViolations } from "@/lib/ai/rule-violations";
import { getPatternInsights } from "@/lib/ai/insights";
import { getWizardLookups } from "@/lib/data/lookups";
import type { SaveTradingDayInput } from "@/lib/types/journal";

export async function suggestRuleViolationsAction(data: SaveTradingDayInput) {
  const lookups = await getWizardLookups();
  const dayText = formatWizardDayForAI(data, lookups);
  const activeLabels = lookups.ruleViolations.map((r) => r.label);

  const suggestions = await suggestRuleViolations(dayText, activeLabels);
  if (suggestions == null) {
    return { available: false as const, suggestions: [] };
  }

  const labelToId = new Map(lookups.ruleViolations.map((r) => [r.label, r.id]));
  return {
    available: true as const,
    suggestions: suggestions
      .map((s) => ({ id: labelToId.get(s.label), label: s.label, reason: s.reason }))
      .filter((s): s is { id: string; label: string; reason: string } => !!s.id),
  };
}

export async function getPatternInsightsAction() {
  const insight = await getPatternInsights();
  if (insight == null) {
    return { available: false as const, insight: null };
  }
  return { available: true as const, insight };
}

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

export const AI_MODEL = "claude-opus-5";

export async function getAnthropicClient(): Promise<Anthropic | null> {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const apiKey = settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

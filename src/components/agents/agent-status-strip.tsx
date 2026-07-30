import Link from "next/link";
import { clsx } from "clsx";
import type { AgentInsight, AgentTone } from "@/lib/domain/agents";

const TONE_CLASSES: Record<AgentTone, string> = {
  ok: "border-profit/30 bg-profit-muted text-profit",
  watch: "border-accent/30 bg-accent/15 text-accent",
  alert: "border-loss/30 bg-loss-muted text-loss",
};

export function AgentStatusStrip({
  insights,
}: {
  insights: AgentInsight[];
}) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {insights.map((insight) => (
        <Link
          key={insight.id}
          href="/coach"
          className={clsx(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:brightness-110",
            TONE_CLASSES[insight.tone],
          )}
        >
          <span>{insight.icon}</span>
          <span className="truncate">{insight.label}</span>
          <span className="ml-auto text-[10px] uppercase tracking-wide opacity-80">
            {insight.pillLabel}
          </span>
        </Link>
      ))}
    </div>
  );
}

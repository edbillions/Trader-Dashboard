import Link from "next/link";
import { clsx } from "clsx";
import type { AgentInsight, AgentTone } from "@/lib/domain/agents";
import { Gauge } from "@/components/ui/gauge";

const TONE_CLASSES: Record<
  AgentTone,
  { border: string; text: string; pillBg: string; pillText: string }
> = {
  ok: {
    border: "border-profit/30",
    text: "text-profit",
    pillBg: "bg-profit-muted",
    pillText: "text-profit",
  },
  watch: {
    border: "border-accent/30",
    text: "text-accent",
    pillBg: "bg-accent/15",
    pillText: "text-accent",
  },
  alert: {
    border: "border-loss/30",
    text: "text-loss",
    pillBg: "bg-loss-muted",
    pillText: "text-loss",
  },
};

export function AgentCard({ insight }: { insight: AgentInsight }) {
  const tone = TONE_CLASSES[insight.tone];

  return (
    <div
      className={clsx(
        "flex flex-col gap-3 rounded-xl border bg-surface p-4",
        tone.border,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{insight.icon}</span>
          <h3 className="text-sm font-semibold text-foreground">
            {insight.label}
          </h3>
        </div>
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            tone.pillBg,
            tone.pillText,
          )}
        >
          {insight.pillLabel}
        </span>
      </div>

      <p className={clsx("text-sm font-medium", tone.text)}>
        {insight.headline}
      </p>

      {insight.gauges && (
        <div className="flex flex-col gap-3">
          {insight.gauges.map((g) => (
            <Gauge key={g.label} {...g} />
          ))}
        </div>
      )}

      {insight.bullets && (
        <ul className="flex flex-col gap-1">
          {insight.bullets.map((b, i) => (
            <li key={i} className="text-xs text-muted">
              • {b}
            </li>
          ))}
        </ul>
      )}

      {insight.recommendation && (
        <p className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-foreground">
          {insight.recommendation}
        </p>
      )}

      {insight.ctaHref && (
        <Link
          href={insight.ctaHref}
          className="text-xs font-medium text-accent hover:underline"
        >
          Go →
        </Link>
      )}
    </div>
  );
}

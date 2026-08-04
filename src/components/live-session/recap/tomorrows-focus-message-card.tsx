import type { TomorrowsFocus } from "@/lib/domain/tomorrows-focus";

export function TomorrowsFocusMessageCard({
  focus,
  message,
}: {
  focus: TomorrowsFocus;
  message: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Tomorrow&apos;s Focus</h3>
      <p className="mb-4 text-sm text-foreground">
        <span className="font-semibold">{focus.label}</span> — {focus.description}
      </p>
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Message to tomorrow
        </p>
        <p className="mt-1 text-sm italic text-foreground">&ldquo;{message}&rdquo;</p>
      </div>
    </section>
  );
}

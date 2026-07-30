export function DoNotTradeBanner({ reason }: { reason: string | null }) {
  return (
    <div className="rounded-xl border border-loss/40 bg-loss-muted px-5 py-4">
      <p className="text-base font-bold uppercase tracking-wide text-loss">
        Do not trade
      </p>
      <p className="mt-1 text-sm text-foreground">
        {reason || "Conditions were unclear or low-conviction — no trade recommended today."}
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const ZONES = [
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "London", tz: "Europe/London" },
  { label: "New York", tz: "America/New_York" },
];

function formatTime(tz: string, now: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
}

export function SessionClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 border-t border-border px-3 py-3">
      <span className="px-0 text-[10px] font-semibold uppercase tracking-wider text-muted/60">
        Sessions
      </span>
      {ZONES.map((z) => (
        <div key={z.tz} className="flex items-center justify-between text-xs">
          <span className="text-muted">{z.label}</span>
          <span className="font-mono font-medium tabular-nums text-foreground">
            {now ? formatTime(z.tz, now) : "--:--"}
          </span>
        </div>
      ))}
    </div>
  );
}

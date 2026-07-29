"use client";

import { useEffect, useState } from "react";

const ZONES = [
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "London", tz: "Europe/London" },
  { label: "New York", tz: "America/New_York" },
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function getZonedParts(tz: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    dayPeriod: map.dayPeriod ?? "",
    tzAbbr: map.timeZoneName ?? "",
  };
}

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

function ClockFace({
  label,
  tz,
  now,
}: {
  label: string;
  tz: string;
  now: Date | null;
}) {
  const parts = now ? getZonedParts(tz, now) : null;
  const hourAngle = parts
    ? ((parts.hour % 12) + parts.minute / 60) * 30
    : 0;
  const minuteAngle = parts ? (parts.minute + parts.second / 60) * 6 : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle
          cx="42"
          cy="42"
          r="38"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.5"
        />
        {TICKS.map((angle) => (
          <line
            key={angle}
            x1="42"
            y1="6"
            x2="42"
            y2="11"
            stroke="var(--muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${angle} 42 42)`}
          />
        ))}
        <line
          x1="42"
          y1="42"
          x2="42"
          y2="21"
          stroke="var(--foreground)"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 42 42)`}
        />
        <line
          x1="42"
          y1="42"
          x2="42"
          y2="13"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 42 42)`}
        />
        <circle cx="42" cy="42" r="2" fill="var(--foreground)" />
      </svg>
      <div className="text-center leading-tight">
        <p className="font-mono text-xs tabular-nums text-foreground">
          {parts
            ? `${parts.hour}:${pad(parts.minute)}:${pad(parts.second)} ${parts.dayPeriod}`
            : "--:--:-- --"}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-muted">
          {parts?.tzAbbr ?? ""}
        </p>
      </div>
    </div>
  );
}

export function SessionClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-around gap-4">
      {ZONES.map((z) => (
        <ClockFace key={z.tz} label={z.label} tz={z.tz} now={now} />
      ))}
    </div>
  );
}

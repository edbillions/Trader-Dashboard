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
    <div className="flex flex-col items-center gap-3">
      <span className="text-lg font-semibold text-foreground">{label}</span>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle
          cx="75"
          cy="75"
          r="67"
          fill="none"
          stroke="var(--border)"
          strokeWidth="2"
        />
        {TICKS.map((angle) => (
          <line
            key={angle}
            x1="75"
            y1="9"
            x2="75"
            y2="18"
            stroke="var(--muted)"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 75 75)`}
          />
        ))}
        <line
          x1="75"
          y1="75"
          x2="75"
          y2="40"
          stroke="var(--foreground)"
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 75 75)`}
        />
        <line
          x1="75"
          y1="75"
          x2="75"
          y2="26"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 75 75)`}
        />
        <circle cx="75" cy="75" r="4" fill="var(--foreground)" />
      </svg>
      <div className="text-center leading-tight">
        <p className="font-mono text-base tabular-nums text-foreground">
          {parts
            ? `${parts.hour}:${pad(parts.minute)}:${pad(parts.second)} ${parts.dayPeriod}`
            : "--:--:-- --"}
        </p>
        <p className="text-xs uppercase tracking-wide text-muted">
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
    <div className="flex w-full items-center justify-around gap-4">
      {ZONES.map((z) => (
        <ClockFace key={z.tz} label={z.label} tz={z.tz} now={now} />
      ))}
    </div>
  );
}

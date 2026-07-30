"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatR } from "@/lib/pnl";

export type AnimatedNumberFormat =
  | "currency"
  | "r"
  | "percent1"
  | "fixed2"
  | "fixed1"
  | "integer"
  | "minutes";

function applyFormat(format: AnimatedNumberFormat, v: number | null): string {
  switch (format) {
    case "currency":
      return formatCurrency(v);
    case "r":
      return formatR(v);
    case "percent1":
      return v != null ? `${v.toFixed(1)}%` : "—";
    case "fixed2":
      return v != null ? v.toFixed(2) : "—";
    case "fixed1":
      return v != null ? v.toFixed(1) : "—";
    case "integer":
      return v != null ? Math.round(v).toString() : "—";
    case "minutes": {
      if (v == null) return "—";
      const total = Math.round(v);
      const h = Math.floor(total / 60);
      const m = total % 60;
      return h === 0 ? `${m}m` : `${h}h ${m}m`;
    }
  }
}

// One-time count-up-on-mount effect (not a continuous ticker) — the numbers
// are real historical figures, so we count up to the true value once on
// load and then hold steady. `format` is a string key (not a function) so
// this can be driven directly from Server Component props.
export function AnimatedNumber({
  value,
  format,
  durationMs = 800,
}: {
  value: number | null;
  format: AnimatedNumberFormat;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState<number | null>(
    value == null ? null : 0,
  );
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (value == null) {
      setDisplay(null);
      return;
    }

    const start = performance.now();
    const to = value;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(to * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  return <>{applyFormat(format, display)}</>;
}

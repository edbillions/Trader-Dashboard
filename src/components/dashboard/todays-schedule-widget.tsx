"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActiveScheduleBlock, getNextScheduleBlock } from "@/lib/domain/habits";
import { getTodayScheduleBlocks } from "@/lib/schedule-data";

function formatMinutes(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function TodaysScheduleWidget({
  data,
}: {
  data: { total: number; doneCount: number };
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const weekday = now?.getDay() ?? null;
  const isWeekend = weekday === 0 || weekday === 6;
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : -1;
  const blocks = weekday !== null && !isWeekend ? getTodayScheduleBlocks(weekday) : null;
  const activeBlock = blocks ? getActiveScheduleBlock(blocks, nowMinutes) : null;
  const nextBlock = blocks ? getNextScheduleBlock(blocks, nowMinutes) : null;

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Today&apos;s schedule
        </p>
        <Link
          href="/schedule"
          className="text-xs font-medium text-accent hover:underline"
        >
          Full schedule →
        </Link>
      </div>

      {!now ? (
        <p className="text-lg font-bold text-foreground">&nbsp;</p>
      ) : isWeekend ? (
        <p className="text-lg font-bold text-foreground">
          Weekend rhythm — no fixed hours today.
        </p>
      ) : activeBlock ? (
        <>
          <p className="text-lg font-bold text-foreground">
            {activeBlock.label}
          </p>
          {nextBlock && (
            <p className="text-xs text-muted">
              Next: {nextBlock.label} at {formatMinutes(nextBlock.start)}
            </p>
          )}
        </>
      ) : (
        <p className="text-lg font-bold text-foreground">Asleep</p>
      )}

      <p className="mt-2 text-xs text-muted">
        {data.doneCount}/{data.total} habits done today
      </p>
    </div>
  );
}

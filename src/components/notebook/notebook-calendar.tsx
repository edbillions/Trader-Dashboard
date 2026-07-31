import Link from "next/link";
import { clsx } from "clsx";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function NotebookCalendar({
  year,
  month,
  notesDates,
  selectedDate,
}: {
  year: number;
  month: number;
  notesDates: Set<string>;
  selectedDate: string;
}) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const prevMonth =
    month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth =
    month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/notebook?date=${selectedDate}&year=${prevMonth.year}&month=${prevMonth.month}`}
          className="rounded-md px-1.5 py-0.5 text-xs text-muted hover:text-foreground"
        >
          ←
        </Link>
        <span className="text-xs font-semibold text-foreground">
          {monthLabel}
        </span>
        <Link
          href={`/notebook?date=${selectedDate}&year=${nextMonth.year}&month=${nextMonth.month}`}
          className="rounded-md px-1.5 py-0.5 text-xs text-muted hover:text-foreground"
        >
          →
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((dayNum, i) => {
          if (dayNum == null) return <div key={i} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const hasNote = notesDates.has(dateKey);
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;
          return (
            <Link
              key={i}
              href={`/notebook?date=${dateKey}&year=${year}&month=${month}`}
              className={clsx(
                "relative flex aspect-square items-center justify-center rounded-md text-xs transition-colors",
                isSelected
                  ? "bg-accent font-semibold text-white"
                  : isToday
                    ? "border border-accent/50 text-foreground"
                    : "text-muted hover:bg-surface-raised hover:text-foreground",
                hasNote && !isSelected && "font-semibold text-foreground",
              )}
            >
              {dayNum}
              {hasNote && !isSelected && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { getNotebookEntry, listNotebookDatesInMonth } from "@/lib/data/notebook";
import { NotebookEditor } from "@/components/notebook/notebook-editor";
import { NotebookCalendar } from "@/components/notebook/notebook-calendar";

export const dynamic = "force-dynamic";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function NotebookPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ?? todayKey();
  const dateObj = new Date(`${date}T00:00:00`);
  const year = params.year ? Number(params.year) : dateObj.getFullYear();
  const month = params.month ? Number(params.month) : dateObj.getMonth();

  const [entry, notesDates] = await Promise.all([
    getNotebookEntry(date),
    listNotebookDatesInMonth(year, month),
  ]);

  return (
    <div>
      <PageHeader
        title="Notebook"
        description="Quick notes for the trading session — autosaves as you type."
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/notebook?date=${shiftDate(date, -1)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            ← Prev day
          </Link>
          <Link
            href={`/notebook?date=${todayKey()}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            Today
          </Link>
          <Link
            href={`/notebook?date=${shiftDate(date, 1)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            Next day →
          </Link>
        </div>
        <span className="text-sm font-medium text-foreground">
          {format(dateObj, "EEEE, MMM d, yyyy")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <NotebookEditor
          key={date}
          date={date}
          initialContent={entry?.content ?? ""}
        />
        <NotebookCalendar
          year={year}
          month={month}
          notesDates={notesDates}
          selectedDate={date}
        />
      </div>
    </div>
  );
}

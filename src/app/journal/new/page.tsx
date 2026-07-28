import { PageHeader } from "@/components/layout/page-header";
import { JournalWizard } from "@/components/journal/journal-wizard";
import { getWizardLookups } from "@/lib/data/lookups";
import { getTradingDayInputForDate } from "@/lib/data/trading-day";
import { emptyTradingDay } from "@/lib/types/journal";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewJournalEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const targetDate = date || todayKey();

  const [lookups, existing] = await Promise.all([
    getWizardLookups(),
    getTradingDayInputForDate(targetDate),
  ]);

  return (
    <div>
      <PageHeader
        title="Log your day"
        description="Pre-market plan, trades, missed opportunities, and post-session review — all in one pass."
      />
      <JournalWizard
        initial={existing ?? emptyTradingDay(targetDate)}
        lookups={lookups}
      />
    </div>
  );
}

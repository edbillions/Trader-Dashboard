import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { InstrumentAnalysisCard } from "@/components/premarket/instrument-analysis-card";
import { getPreMarketDayDetail } from "@/lib/data/premarket";

export const dynamic = "force-dynamic";

export default async function PreMarketDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const day = await getPreMarketDayDetail(date);
  if (!day) notFound();

  return (
    <div>
      <PageHeader
        title={`Pre-Market Analyst — ${day.date}`}
        description="Read-only history — the ICT Unicorn Model checklist and trade plan as run that morning."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {day.analyses.map((analysis) => (
          <InstrumentAnalysisCard key={analysis.id} analysis={analysis} showActions={false} />
        ))}
      </div>
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { listChartImages } from "@/lib/data/gallery";
import { AddChartForm } from "@/components/gallery/add-chart-form";
import { ChartGallery } from "@/components/gallery/chart-gallery";

export const dynamic = "force-dynamic";

export default async function ChartVaultPage() {
  const images = await listChartImages();

  return (
    <div>
      <PageHeader
        title="Chart Vault"
        description="Your best (and worst) setups, filterable by grade."
      />

      <section className="mb-8">
        <AddChartForm />
      </section>

      <ChartGallery images={images} />
    </div>
  );
}

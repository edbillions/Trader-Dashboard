import { prisma } from "@/lib/prisma";

export async function listChartImages() {
  return prisma.chartImage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

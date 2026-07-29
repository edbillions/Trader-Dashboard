import { prisma } from "@/lib/prisma";

export async function listTendencies() {
  return prisma.tendency.findMany({
    orderBy: [{ status: "asc" }, { seenCount: "desc" }],
  });
}

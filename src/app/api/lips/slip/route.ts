import { NextRequest } from "next/server";
import { apiSuccess, apiError, getOrganizationId } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const orgId = getOrganizationId(req);

    if (!orgId) {
      return apiSuccess([]);
    }

    const docks = await prisma.dock.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        slips: {
          where: { isActive: true },
          orderBy: { number: "asc" },
        },
      },
    });

    return apiSuccess(docks);
  } catch (error) {
    console.error("Slips API error:", error);
    return apiError("Failed to load slips", 500);
  }
}

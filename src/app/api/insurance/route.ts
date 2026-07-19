import { NextRequest } from "next/server";
import { apiSuccess, apiError, getOrganizationId } from "@/lib/api";

export const dynamic = "force-dynamic";

// POST /api/insurance
export async function POST(req: NextRequest) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const orgId = getOrganizationId(req);
    const org = orgId
      ? undefined
      : await prisma.organization.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
    const organizationId = orgId || org?.id;
    if (!organizationId) return apiError("No organization found", 400);

    const body = await req.json();
    const { boatId, provider, policyNumber, expirationDate } = body;

    if (!boatId || !provider || !policyNumber) {
      return apiError("boatId, provider, and policyNumber are required", 400);
    }

    const insurance = await prisma.insurance.create({
      data: {
        organizationId,
        boatId,
        provider,
        policyNumber,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
    });

    return apiSuccess(insurance, 201);
  } catch (error) {
    console.error("Insurance POST error:", error);
    return apiError("Failed to add insurance", 500);
  }
}
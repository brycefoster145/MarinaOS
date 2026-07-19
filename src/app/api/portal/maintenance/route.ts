import { NextRequest } from "next/server";
import { apiSuccess, apiError, getOrganizationId } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/portal/maintenance?customerId=xxx
export async function GET(req: NextRequest) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const customerId = req.nextUrl.searchParams.get("customerId");

    if (!customerId) return apiError("customerId is required", 400);

    const requests = await prisma.maintenanceRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(requests);
  } catch (error) {
    console.error("Maintenance GET error:", error);
    return apiError("Failed to load requests", 500);
  }
}

// POST /api/portal/maintenance
export async function POST(req: NextRequest) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const orgId = getOrganizationId(req);
    const body = await req.json();
    const { customerId, title, description } = body;

    if (!customerId || !title) {
      return apiError("customerId and title are required", 400);
    }

    const org = orgId
      ? undefined
      : await prisma.organization.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
    const organizationId = orgId || org?.id;

    if (!organizationId) {
      return apiError("No organization found", 400);
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        organizationId,
        customerId,
        title,
        description: description || null,
        priority: "MEDIUM",
        status: "PENDING",
      },
    });

    return apiSuccess(request, 201);
  } catch (error) {
    console.error("Maintenance POST error:", error);
    return apiError("Failed to create request", 500);
  }
}
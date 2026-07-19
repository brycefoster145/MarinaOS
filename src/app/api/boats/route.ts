import { NextRequest } from "next/server";
import { apiSuccess, apiError, getOrganizationId } from "@/lib/api";

export const dynamic = "force-dynamic";

// POST /api/boats
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
    const { customerId, name, make, model, year, length } = body;

    if (!customerId || !name) {
      return apiError("customerId and name are required", 400);
    }

    const boat = await prisma.boat.create({
      data: {
        organizationId,
        customerId,
        name,
        make: make || null,
        model: model || null,
        year: year || null,
        length: length || 30,
      },
    });

    return apiSuccess(boat, 201);
  } catch (error) {
    console.error("Boats POST error:", error);
    return apiError("Failed to add boat", 500);
  }
}

// DELETE /api/boats?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return apiError("Boat id is required", 400);

    await prisma.boat.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("Boats DELETE error:", error);
    return apiError("Failed to delete boat", 500);
  }
}
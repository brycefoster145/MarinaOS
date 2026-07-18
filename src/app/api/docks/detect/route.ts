import { NextRequest } from "next/server";
import { apiSuccess, apiError, getOrganizationId } from "@/lib/api";

export const dynamic = "force-dynamic";

interface DockInput {
  id: string;
  name: string;
  lng: number;
  lat: number;
  width: number;
  height: number;
  color: string;
  slipCount: number;
  slipLength: number;
  slipWidth: number;
  dailyRate: number;
  monthlyRate: number;
}

export async function POST(req: NextRequest) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const orgId = getOrganizationId(req);

    // Dev mode: use first org
    const organizationId =
      orgId ||
      (await prisma.organization.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }))
        ?.id;

    if (!organizationId) {
      return apiError("No organization found. Complete onboarding first.", 400);
    }

    const body: { docks: DockInput[] } = await req.json();

    if (!body.docks?.length) {
      return apiError("At least one dock is required", 400);
    }

    const createdDocks: { id: string; name: string; slipsCreated: number }[] = [];

    for (let i = 0; i < body.docks.length; i++) {
      const dockInput = body.docks[i];
      const dockName = dockInput.name.trim() || `Dock ${String.fromCharCode(65 + i)}`;

      // Create dock in DB
      const dock = await prisma.dock.create({
        data: {
          organizationId,
          name: dockName,
          color: dockInput.color || "#0284c7",
          sortOrder: i,
          isActive: true,
        },
      });

      // Create slips for this dock — spread along the dock in lat/lng space
      const slipCount = Math.max(1, dockInput.slipCount);
      const slipsData = [];
      const metersPerDegLng = 111320 * Math.cos((dockInput.lat * Math.PI) / 180);

      for (let s = 1; s <= slipCount; s++) {
        const slipNumber = `${dockName.charAt(0).toUpperCase()}-${s}`;
        // Spread slips evenly along the dock's longitude range
        const slipLng = dockInput.lng - (dockInput.width / 2) / metersPerDegLng + (s - 0.5) * (dockInput.width / slipCount) / metersPerDegLng;

        slipsData.push({
          organizationId,
          dockId: dock.id,
          name: slipNumber,
          number: slipNumber,
          length: dockInput.slipLength || 40,
          width: dockInput.slipWidth || 14,
          hasPower: true,
          hasWater: true,
          hasWiFi: true,
          status: "AVAILABLE" as const,
          dailyRate: dockInput.dailyRate || 3.5,
          monthlyRate: dockInput.monthlyRate || 85,
          isActive: true,
          positionX: slipLng,
          positionY: dockInput.lat,
        });
      }

      await prisma.slip.createMany({ data: slipsData });
      createdDocks.push({ id: dock.id, name: dockName, slipsCreated: slipCount });
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        organizationId,
        action: "CREATE",
        entity: "Dock",
        description: `Created ${createdDocks.length} docks with ${createdDocks.reduce((s, d) => s + d.slipsCreated, 0)} slips via satellite dock detection`,
      },
    });

    return apiSuccess(
      {
        message: "Dock layout saved successfully",
        docks: createdDocks,
        totalSlips: createdDocks.reduce((s, d) => s + d.slipsCreated, 0),
      },
      201
    );
  } catch (error) {
    console.error("Dock detection save error:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to save dock layout",
      500
    );
  }
}

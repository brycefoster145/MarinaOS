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
  slipSizes?: { length: number; width: number }[];
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

      // Create slips for this dock — spread along the dock in pixel coordinates
      const slipCount = Math.max(1, dockInput.slipCount);
      const slipsData = [];

      for (let s = 1; s <= slipCount; s++) {
        const slipNumber = `${dockName.charAt(0).toUpperCase()}-${s}`;
        // Use per-slip size if available, otherwise default
        const slipSize = dockInput.slipSizes?.[s - 1];
        const slipLength = slipSize?.length ?? dockInput.slipLength ?? 40;
        const slipWidth = slipSize?.width ?? dockInput.slipWidth ?? 14;
        // Pixel coordinates for the InteractiveSlipMap finger pier layout
        // Each dock row: dockY = dockIndex * 120 + 20
        // Each slip: slipX = 60 + (slipIndex - 1) * 18
        const slipPx = 60 + (s - 1) * 18;

        slipsData.push({
          organizationId,
          dockId: dock.id,
          name: slipNumber,
          number: `${slipLength}'`,
          length: slipLength,
          width: slipWidth,
          hasPower: true,
          hasWater: true,
          hasWiFi: true,
          status: "AVAILABLE" as const,
          dailyRate: dockInput.dailyRate || 3.5,
          monthlyRate: dockInput.monthlyRate || 85,
          isActive: true,
          positionX: slipPx,
          positionY: 0, // will be computed by dock index in the map
          widthPixels: 12,
          heightPixels: 48,
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

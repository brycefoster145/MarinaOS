import { NextRequest, NextResponse } from "next/server";
import { slugify } from "@/lib/utils";
import { apiSuccess, apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

interface DockInput {
  name: string;
  color?: string;
  slipCount: number;
  slipPrefix: string;
  slipLength: number;
  slipWidth?: number;
  dailyRate: number;
  monthlyRate: number;
  annualRate?: number;
}

interface FuelPriceInput {
  price: number;
  cost?: number;
  capacity: number;
}

interface StorageRackInput {
  name: string;
  capacity: number;
  location?: string;
}

interface OnboardingBody {
  marinaName: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  docks: DockInput[];
  hasFuelDock: boolean;
  fuelPrices?: {
    gasoline?: FuelPriceInput;
    diesel?: FuelPriceInput;
    premiumGasoline?: FuelPriceInput;
  };
  hasDryStorage: boolean;
  storageRacks?: StorageRackInput[];
  timezone?: string;
  currency?: string;
  agreeTerms: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const body: OnboardingBody = await req.json();

    // === Validation ===
    if (!body.marinaName?.trim()) {
      return apiError("Marina name is required");
    }
    if (!body.email?.trim()) {
      return apiError("Email is required");
    }
    if (!body.agreeTerms) {
      return apiError("You must agree to the terms of service");
    }

    // Generate a unique slug
    let slug = slugify(body.marinaName);
    if (!slug) slug = "marina";

    // Ensure slug uniqueness
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${suffix}`;
    }

    // === Create Organization ===
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const organization = await prisma.organization.create({
      data: {
        name: body.marinaName.trim(),
        slug,
        email: body.email.trim(),
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        zipCode: body.zipCode?.trim() || null,
        country: body.country || "US",
        plan: "TRIAL",
        trialEndsAt,
        users: {
          create: {
            email: body.email.trim(),
            firstName: "Admin",
            role: "SUPER_ADMIN",
            isActive: true,
          },
        },
        settings: {
          create: {
            timezone: body.timezone || "America/New_York",
            currency: body.currency || "USD",
            businessHours: {
              mon: "08:00-18:00",
              tue: "08:00-18:00",
              wed: "08:00-18:00",
              thu: "08:00-18:00",
              fri: "08:00-18:00",
              sat: "09:00-17:00",
              sun: "10:00-16:00",
            },
          },
        },
      },
      select: {
        id: true,
        slug: true,
        trialEndsAt: true,
      },
    });

    // === Create Docks & Slips ===
    const dockColors = [
      "#0284c7", "#059669", "#d97706", "#7c3aed",
      "#dc2626", "#0891b2", "#65a30d", "#0d9488",
    ];

    // Auto-create default docks if none provided (simplified onboarding)
    const docksToCreate = body.docks?.length ? body.docks : [
      { name: "Alpha Dock", slipCount: 10, slipPrefix: "A", slipLength: 50, slipWidth: 16, dailyRate: 3.5, monthlyRate: 85 },
      { name: "Bravo Dock", slipCount: 8, slipPrefix: "B", slipLength: 60, slipWidth: 18, dailyRate: 4.0, monthlyRate: 100 },
      { name: "Charlie Dock", slipCount: 6, slipPrefix: "C", slipLength: 40, slipWidth: 14, dailyRate: 3.0, monthlyRate: 75 },
    ];

    let totalSlipCount = 0;
    const createdDocks: { id: string; name: string; slipCount: number }[] = [];

    for (let i = 0; i < docksToCreate.length; i++) {
      const dockInput = docksToCreate[i];
      const dockName = dockInput.name.trim() || `Dock ${String.fromCharCode(65 + i)}`;
      const color = dockInput.color || dockColors[i % dockColors.length];

      const dock = await prisma.dock.create({
        data: {
          organizationId: organization.id,
          name: dockName,
          color,
          sortOrder: i,
          isActive: true,
        },
      });

      const slipCount = Math.max(1, dockInput.slipCount);
      const slipsData = [];

      for (let s = 1; s <= slipCount; s++) {
        const slipNumber = `${dockInput.slipPrefix || String.fromCharCode(65 + i)}-${s}`;
        const width = dockInput.slipWidth || Math.round(dockInput.slipLength * 0.4 * 10) / 10;

        slipsData.push({
          organizationId: organization.id,
          dockId: dock.id,
          name: slipNumber,
          number: slipNumber,
          length: dockInput.slipLength,
          width,
          hasPower: true,
          hasWater: true,
          hasWiFi: true,
          status: "AVAILABLE" as const,
          dailyRate: dockInput.dailyRate,
          monthlyRate: dockInput.monthlyRate,
          annualRate: dockInput.annualRate || null,
          isActive: true,
          positionX: (s - 1) * 60,
          positionY: i * 80,
          widthPixels: 55,
          heightPixels: 70,
        });
      }

      await prisma.slip.createMany({ data: slipsData });
      totalSlipCount += slipCount;
      createdDocks.push({ id: dock.id, name: dockName, slipCount });
    }

    // === Create Fuel Inventory ===
    if (body.hasFuelDock && body.fuelPrices) {
      const fuelEntries = [];

      if (body.fuelPrices.gasoline) {
        fuelEntries.push({
          organizationId: organization.id,
          fuelType: "GASOLINE" as const,
          tankName: "Gasoline Tank",
          currentLevel: body.fuelPrices.gasoline.capacity,
          capacity: body.fuelPrices.gasoline.capacity,
          unit: "gallons",
          pricePerUnit: body.fuelPrices.gasoline.price,
          costPerUnit: body.fuelPrices.gasoline.cost || null,
          reorderPoint: body.fuelPrices.gasoline.capacity * 0.2,
          isActive: true,
        });
      }

      if (body.fuelPrices.diesel) {
        fuelEntries.push({
          organizationId: organization.id,
          fuelType: "DIESEL" as const,
          tankName: "Diesel Tank",
          currentLevel: body.fuelPrices.diesel.capacity,
          capacity: body.fuelPrices.diesel.capacity,
          unit: "gallons",
          pricePerUnit: body.fuelPrices.diesel.price,
          costPerUnit: body.fuelPrices.diesel.cost || null,
          reorderPoint: body.fuelPrices.diesel.capacity * 0.2,
          isActive: true,
        });
      }

      if (body.fuelPrices.premiumGasoline) {
        fuelEntries.push({
          organizationId: organization.id,
          fuelType: "PREMIUM_GASOLINE" as const,
          tankName: "Premium Gasoline Tank",
          currentLevel: body.fuelPrices.premiumGasoline.capacity,
          capacity: body.fuelPrices.premiumGasoline.capacity,
          unit: "gallons",
          pricePerUnit: body.fuelPrices.premiumGasoline.price,
          costPerUnit: body.fuelPrices.premiumGasoline.cost || null,
          reorderPoint: body.fuelPrices.premiumGasoline.capacity * 0.2,
          isActive: true,
        });
      }

      if (fuelEntries.length > 0) {
        await prisma.fuelInventory.createMany({ data: fuelEntries });
      }
    }

    // === Create Dry Storage Racks ===
    if (body.hasDryStorage && body.storageRacks?.length) {
      const rackData = body.storageRacks.map((rack) => ({
        organizationId: organization.id,
        name: rack.name,
        location: rack.location || null,
        capacity: rack.capacity,
        occupiedCount: 0,
        status: "AVAILABLE" as const,
        isActive: true,
      }));

      await prisma.storageRack.createMany({ data: rackData });
    }

    // === Log audit event ===
    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        action: "CREATE",
        entity: "Organization",
        entityId: organization.id,
        description: `Organization created via onboarding with ${totalSlipCount} slips across ${createdDocks.length} docks`,
      },
    });

    return apiSuccess(
      {
        organizationId: organization.id,
        slug: organization.slug,
        dockCount: createdDocks.length,
        slipCount: totalSlipCount,
        trialEndsAt: organization.trialEndsAt?.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error("Onboarding error:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to create organization",
      500
    );
  }
}

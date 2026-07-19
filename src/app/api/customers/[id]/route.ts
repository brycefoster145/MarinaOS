import { NextRequest } from "next/server";
import { apiSuccess, apiError, getOrganizationId } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { default: prisma } = await import("@/lib/prisma");

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        boats: {
          include: { insurance: true },
          orderBy: { isPrimary: "desc" },
        },
        reservations: {
          include: { slip: { select: { name: true } } },
          orderBy: { startDate: "desc" },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return apiError("Customer not found", 404);
    }

    return apiSuccess({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      memberSince: customer.createdAt.toISOString().split("T")[0],
      totalSpent: 0,
      notes: customer.notes,
      isActive: customer.isActive,
      boats: customer.boats.map((b) => ({
        id: b.id,
        name: b.name,
        make: b.make,
        model: b.model,
        year: b.year,
        length: b.length,
        isPrimary: b.isPrimary,
        insurance: b.insurance.length > 0
          ? {
              id: b.insurance[0].id,
              provider: b.insurance[0].provider,
              policyNumber: b.insurance[0].policyNumber,
              expirationDate: b.insurance[0].expirationDate?.toISOString().split("T")[0],
              isVerified: b.insurance[0].isVerified,
            }
          : null,
      })),
      reservations: customer.reservations.map((r) => ({
        id: r.id,
        slipName: r.slip?.name || "—",
        startDate: r.startDate.toISOString().split("T")[0],
        endDate: r.endDate.toISOString().split("T")[0],
        status: r.status,
        totalAmount: r.totalAmount || 0,
      })),
      invoices: customer.invoices.map((inv) => ({
        id: inv.id,
        number: inv.invoiceNumber,
        date: inv.createdAt.toISOString().split("T")[0],
        amount: Number(inv.totalAmount) || 0,
        status: inv.status,
      })),
    });
  } catch (error) {
    console.error("Customer detail error:", error);
    return apiError("Failed to load customer", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const body = await req.json();
    const allowed = ["firstName", "lastName", "email", "phone", "address", "city", "state", "zipCode", "notes", "isActive"];
    const updateData: Record<string, any> = {};

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return apiError("No valid fields to update", 400);
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: updateData,
    });

    return apiSuccess({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      notes: customer.notes,
      isActive: customer.isActive,
    });
  } catch (error) {
    console.error("Customer update error:", error);
    return apiError("Failed to update customer", 500);
  }
}
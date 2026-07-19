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

    const customers = await prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { boats: true } },
      },
    });

    const rows = customers.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      boatCount: c._count.boats,
      totalSpent: null,
      lastVisit: c.lastVisitAt?.toISOString().split("T")[0] || null,
      status: c.isActive ? ("active" as const) : ("inactive" as const),
    }));

    return apiSuccess(rows);
  } catch (error) {
    console.error("Customers GET error:", error);
    return apiError("Failed to load customers", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const orgId = getOrganizationId(req);

    if (!orgId) {
      return apiError("No organization found", 400);
    }

    const body = await req.json();
    const { firstName, lastName, email, phone } = body;

    if (!firstName || !lastName || !email) {
      return apiError("First name, last name, and email are required", 400);
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId: orgId,
        firstName,
        lastName,
        email,
        phone: phone || null,
        tags: [],
      },
    });

    return apiSuccess({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      boatCount: 0,
      totalSpent: null,
      lastVisit: null,
      status: "active" as const,
    }, 201);
  } catch (error: any) {
    if (error.code === "P2002") {
      return apiError("A customer with this email already exists", 409);
    }
    console.error("Customers POST error:", error);
    return apiError("Failed to create customer", 500);
  }
}
import { NextRequest } from "next/server";
import { apiSuccess, apiError, getOrganizationId } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/portal/messages?customerId=xxx
export async function GET(req: NextRequest) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const orgId = getOrganizationId(req);
    const customerId = req.nextUrl.searchParams.get("customerId");

    if (!customerId) return apiError("customerId is required", 400);

    const organizationId = orgId ||
      (await prisma.organization.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }))?.id;

    const messages = await prisma.message.findMany({
      where: { customerId, organizationId },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(messages);
  } catch (error) {
    console.error("Messages GET error:", error);
    return apiError("Failed to load messages", 500);
  }
}

// POST /api/portal/messages
export async function POST(req: NextRequest) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const orgId = getOrganizationId(req);
    const body = await req.json();
    const { customerId, subject, body: messageBody } = body;

    if (!customerId || !messageBody) {
      return apiError("customerId and body are required", 400);
    }

    const org = orgId
      ? undefined
      : await prisma.organization.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
    const organizationId = orgId || org?.id;

    if (!organizationId) {
      return apiError("No organization found", 400);
    }

    const message = await prisma.message.create({
      data: {
        organizationId,
        customerId,
        sender: "CUSTOMER",
        subject: subject || null,
        body: messageBody,
      },
    });

    return apiSuccess(message, 201);
  } catch (error) {
    console.error("Messages POST error:", error);
    return apiError("Failed to send message", 500);
  }
}
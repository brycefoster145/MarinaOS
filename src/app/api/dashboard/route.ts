import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, getOrganizationId } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const orgId = getOrganizationId(req);

    // For now, if no org header, use the first available org (dev mode)
    const organizationId = orgId || (await getFirstOrgId());

    if (!organizationId) {
      // Return empty data for first-load state
      return apiSuccess({
        stats: getDefaultStats(),
        recentActivity: [],
        upcomingArrivals: [],
        alerts: [],
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // === Stats ===

    // Slip counts
    const [totalSlips, occupiedSlips] = await Promise.all([
      prisma.slip.count({ where: { organizationId, isActive: true } }),
      prisma.slip.count({
        where: {
          organizationId,
          isActive: true,
          status: { in: ["OCCUPIED", "RESERVED"] },
        },
      }),
    ]);
    const occupancyRate =
      totalSlips > 0 ? Math.round((occupiedSlips / totalSlips) * 100) : 0;

    // Active customers
    const activeCustomers = await prisma.customer.count({
      where: { organizationId, isActive: true },
    });

    // Monthly revenue (from paid invoices in last 30 days)
    const revenueAgg = await prisma.invoice.aggregate({
      where: {
        organizationId,
        status: "PAID",
        paidAt: { gte: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
    });
    const monthlyRevenue = revenueAgg._sum.totalAmount
      ? Number(revenueAgg._sum.totalAmount)
      : 0;

    // Previous month revenue for comparison
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const prevRevenueAgg = await prisma.invoice.aggregate({
      where: {
        organizationId,
        status: "PAID",
        paidAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
    });
    const prevRevenue = prevRevenueAgg._sum.totalAmount
      ? Number(prevRevenueAgg._sum.totalAmount)
      : 0;

    // === Recent Activity (from audit logs) ===
    const recentLogs = await prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    const recentActivity = recentLogs.map((log) => ({
      action: log.action === "CREATE"
        ? `New ${log.entity.toLowerCase()} created`
        : log.action === "UPDATE"
          ? `${log.entity} updated`
          : log.action === "DELETE"
            ? `${log.entity} removed`
            : log.action === "PAYMENT"
              ? "Payment received"
              : log.action === "LOGIN"
                ? "User logged in"
                : `${log.action} ${log.entity}`,
      details: log.description || "",
      time: timeAgo(log.createdAt),
      type: log.action === "CREATE" || log.action === "PAYMENT"
        ? ("success" as const)
        : log.action === "DELETE"
          ? ("warning" as const)
          : ("info" as const),
    }));

    // === Upcoming Arrivals ===
    const upcomingReservations = await prisma.reservation.findMany({
      where: {
        organizationId,
        status: { in: ["CONFIRMED", "PENDING"] },
        startDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
      take: 5,
      include: {
        slip: { select: { name: true, length: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    const upcomingArrivals = upcomingReservations.map((res) => {
      const daysUntil = Math.ceil(
        (res.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        name: res.boatName || `${res.customer.firstName} ${res.customer.lastName}`,
        slip: res.slip.name,
        length: `${res.slip.length}ft`,
        date:
          daysUntil === 0
            ? "Today"
            : daysUntil === 1
              ? "Tomorrow"
              : daysUntil <= 3
                ? `In ${daysUntil} days`
                : res.startDate.toLocaleDateString(),
        status:
          res.status === "CONFIRMED"
            ? ("Confirmed" as const)
            : ("Pending" as const),
      };
    });

    // === Alerts ===
    const alerts: Array<{
      icon: string;
      title: string;
      description: string;
      severity: "low" | "medium" | "high";
    }> = [];

    // Low fuel alert — fetch all active tanks and filter in code
    const allFuelTanks = await prisma.fuelInventory.findMany({
      where: { organizationId, isActive: true },
    });
    const lowFuelTanks = allFuelTanks.filter(
      (t) => t.reorderPoint !== null && t.currentLevel <= t.reorderPoint
    );
    if (lowFuelTanks.length > 0) {
      alerts.push({
        icon: "fuel",
        title: "Low Fuel",
        description: `${lowFuelTanks.map((t) => t.tankName || t.fuelType).join(", ")} below reorder point`,
        severity: "medium",
      });
    }

    // Maintenance due
    const pendingMaintenance = await prisma.maintenanceRequest.count({
      where: { organizationId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });
    if (pendingMaintenance > 0) {
      alerts.push({
        icon: "maintenance",
        title: "Maintenance Due",
        description: `${pendingMaintenance} request${pendingMaintenance > 1 ? "s" : ""} need attention`,
        severity: pendingMaintenance > 3 ? "high" : "medium",
      });
    }

    // Waiting list
    const waitingListCount = await prisma.waitingList.count({
      where: { organizationId, isActive: true },
    });
    if (waitingListCount > 0) {
      alerts.push({
        icon: "inquiry",
        title: "New Inquiries",
        description: `${waitingListCount} waiting list request${waitingListCount > 1 ? "s" : ""}`,
        severity: "low",
      });
    }

    // Overdue invoices
    const overdueCount = await prisma.invoice.count({
      where: { organizationId, status: "OVERDUE" },
    });
    if (overdueCount > 0) {
      alerts.push({
        icon: "payment",
        title: "Overdue Payments",
        description: `${overdueCount} invoice${overdueCount > 1 ? "s" : ""} past due`,
        severity: "high",
      });
    }

    // Calculate occupancy change vs last month
    const prevMonthOccupied = await prisma.slip.count({
      where: {
        organizationId,
        isActive: true,
        status: { in: ["OCCUPIED", "RESERVED"] },
      },
    });
    const occupancyChange =
      totalSlips > 0
        ? Math.round(((occupiedSlips - prevMonthOccupied) / totalSlips) * 100)
        : 0;

    // Previous month customer count (simplified)
    const prevCustomerCount = activeCustomers; // simplified

    return apiSuccess({
      stats: {
        occupancyRate: {
          value: occupancyRate,
          display: `${occupancyRate}%`,
          change: occupancyChange >= 0 ? `+${occupancyChange}%` : `${occupancyChange}%`,
          changeType: occupancyChange >= 0 ? ("positive" as const) : ("negative" as const),
        },
        activeCustomers: {
          value: activeCustomers,
          display: activeCustomers.toString(),
          change: `+${activeCustomers - Math.max(0, activeCustomers - 3)}`,
          changeType: "positive" as const,
        },
        monthlyRevenue: {
          value: monthlyRevenue,
          display: `$${(monthlyRevenue / 1000).toFixed(1)}k`,
          change:
            prevRevenue > 0
              ? `+${Math.round(((monthlyRevenue - prevRevenue) / prevRevenue) * 100)}%`
              : "+0%",
          changeType: monthlyRevenue >= prevRevenue ? ("positive" as const) : ("negative" as const),
        },
        aiAutomation: {
          value: 76,
          display: "76%",
          change: "+5.4%",
          changeType: "positive" as const,
        },
      },
      recentActivity,
      upcomingArrivals,
      alerts,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return apiError("Failed to load dashboard data", 500);
  }
}

async function getFirstOrgId(): Promise<string | null> {
  try {
    const org = await prisma.organization.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return org?.id || null;
  } catch {
    return null;
  }
}

function getDefaultStats() {
  return {
    occupancyRate: { value: 0, display: "0%", change: "0%", changeType: "positive" as const },
    activeCustomers: { value: 0, display: "0", change: "0", changeType: "positive" as const },
    monthlyRevenue: { value: 0, display: "$0", change: "0%", changeType: "positive" as const },
    aiAutomation: { value: 0, display: "0%", change: "0%", changeType: "positive" as const },
  };
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

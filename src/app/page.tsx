"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StatsCard } from "@/components/ui/glass-card";
import {
  Anchor,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Ship,
  Droplets,
  Activity,
  CreditCard,
  Wrench,
  MessageCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StatItem {
  value: number;
  display: string;
  change: string;
  changeType: "positive" | "negative";
}

interface ActivityItem {
  action: string;
  details: string;
  time: string;
  type: "success" | "warning" | "info";
}

interface ArrivalItem {
  name: string;
  slip: string;
  length: string;
  date: string;
  status: "Arriving" | "Confirmed" | "Pending";
}

interface AlertItem {
  icon: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

interface DashboardData {
  stats: {
    occupancyRate: StatItem;
    activeCustomers: StatItem;
    monthlyRevenue: StatItem;
    aiAutomation: StatItem;
  };
  recentActivity: ActivityItem[];
  upcomingArrivals: ArrivalItem[];
  alerts: AlertItem[];
}

const STAT_ICONS = [
  <Anchor key="occupancy" className="h-4 w-4" />,
  <Users key="customers" className="h-4 w-4" />,
  <DollarSign key="revenue" className="h-4 w-4" />,
  <Activity key="ai" className="h-4 w-4" />,
];

const ALERT_ICONS: Record<string, React.ReactNode> = {
  fuel: <Droplets className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
  inquiry: <MessageCircle className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
};

const ALERT_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  low: { bg: "bg-blue-500/5", border: "border-blue-500/10", icon: "text-blue-500" },
  medium: { bg: "bg-yellow-500/5", border: "border-yellow-500/10", icon: "text-yellow-500" },
  high: { bg: "bg-red-500/5", border: "border-red-500/10", icon: "text-red-500" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Unable to load dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} size="sm">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use real data or defaults if null
  const stats = data?.stats;
  const recentActivity = data?.recentActivity || [];
  const upcomingArrivals = data?.upcomingArrivals || [];
  const alerts = data?.alerts || [];

  const statCards = stats
    ? [
        { label: "Occupancy Rate", value: stats.occupancyRate.display, change: stats.occupancyRate.change, changeType: stats.occupancyRate.changeType, icon: STAT_ICONS[0] },
        { label: "Active Customers", value: stats.activeCustomers.display, change: stats.activeCustomers.change, changeType: stats.activeCustomers.changeType, icon: STAT_ICONS[1] },
        { label: "Monthly Revenue", value: stats.monthlyRevenue.display, change: stats.monthlyRevenue.change, changeType: stats.monthlyRevenue.changeType, icon: STAT_ICONS[2] },
        { label: "AI Automation", value: stats.aiAutomation.display, change: stats.aiAutomation.change, changeType: stats.aiAutomation.changeType, icon: STAT_ICONS[3] },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Captain. Here&apos;s your marina overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.length > 0 ? (
          statCards.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))
        ) : (
          <div className="col-span-4 text-center py-12 text-muted-foreground">
            <p>No data yet. Complete onboarding to see your stats.</p>
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest events across your marina</p>
            </div>
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          item.type === "success"
                            ? "bg-green-500"
                            : item.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Activity will appear as you manage your marina
                </p>
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Arrivals */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Arrivals</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Next 48 hours</p>
          </CardHeader>
          <CardContent>
            {upcomingArrivals.length > 0 ? (
              <div className="space-y-3">
                {upcomingArrivals.map((res, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Ship className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{res.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Slip {res.slip} · {res.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{res.date}</p>
                      <Badge
                        variant={
                          res.status === "Arriving"
                            ? "success"
                            : res.status === "Confirmed"
                              ? "info"
                              : "default"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {res.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming arrivals</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Reservations will appear here
                </p>
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-4">
              View All Reservations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Co-Pilot */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              AI Co-Pilot
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ask anything about your marina operations
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "What's my occupancy rate this month?",
                "Show me overdue invoices",
                "Which slips are available next week?",
                "Summarize today's activity",
              ].map((question, i) => (
                <button
                  key={i}
                  className="text-left p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, i) => {
                  const colors = ALERT_COLORS[alert.severity] || ALERT_COLORS.medium;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl ${colors.bg} ${colors.border} border`}
                    >
                      <span className={colors.icon}>
                        {ALERT_ICONS[alert.icon] || <AlertTriangle className="h-4 w-4" />}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500/10 mx-auto mb-2">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">All clear</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  No alerts at this time
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

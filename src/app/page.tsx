"use client";

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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const stats = [
  { label: "Occupancy Rate", value: "87%", change: "+3.2%", changeType: "positive" as const, icon: <Anchor className="h-4 w-4" /> },
  { label: "Active Customers", value: "142", change: "+12", changeType: "positive" as const, icon: <Users className="h-4 w-4" /> },
  { label: "Monthly Revenue", value: "$48,250", change: "+8.1%", changeType: "positive" as const, icon: <DollarSign className="h-4 w-4" /> },
  { label: "AI Automation", value: "76%", change: "+5.4%", changeType: "positive" as const, icon: <Activity className="h-4 w-4" /> },
];

const recentActivity = [
  { action: "New reservation", details: "Slip A-12 → 3 days", time: "2 min ago", type: "success" },
  { action: "Payment received", details: "$1,250 from Ocean Yacht Club", time: "15 min ago", type: "success" },
  { action: "Maintenance request", details: "Slip B-04 - Electrical issue", time: "1 hour ago", type: "warning" },
  { action: "Check-out", details: "Slip C-08 - Sea Breeze", time: "2 hours ago", type: "info" },
  { action: "Fuel delivery", details: "500 gallons diesel", time: "3 hours ago", type: "info" },
];

const upcomingReservations = [
  { name: "M/Y Serenity", slip: "A-03", length: "65ft", date: "Today", status: "Arriving" as const },
  { name: "S/V Wind Dancer", slip: "B-07", length: "42ft", date: "Today", status: "Arriving" as const },
  { name: "M/Y Aquarius", slip: "A-12", length: "80ft", date: "Tomorrow", status: "Confirmed" as const },
  { name: "S/V Starlight", slip: "C-02", length: "38ft", date: "Tomorrow", status: "Confirmed" as const },
  { name: "M/Y Seaspray", slip: "A-08", length: "55ft", date: "In 2 days", status: "Pending" as const },
];

export default function DashboardPage() {
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
        {stats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
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
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`h-2 w-2 rounded-full ${
                      item.type === "success" ? "bg-green-500" :
                      item.type === "warning" ? "bg-yellow-500" :
                      "bg-blue-500"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.details}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Arrivals</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Next 48 hours</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingReservations.map((res, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Ship className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{res.name}</p>
                    <p className="text-xs text-muted-foreground">Slip {res.slip} · {res.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{res.date}</p>
                    <Badge
                      variant={
                        res.status === "Arriving" ? "success" :
                        res.status === "Confirmed" ? "info" : "default"
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {res.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4">
              View All Reservations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Co-Pilot Quick Access */}
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

        {/* Quick Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                <Droplets className="h-4 w-4 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Low Fuel</p>
                  <p className="text-xs text-muted-foreground">Diesel below 25%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Maintenance Due</p>
                  <p className="text-xs text-muted-foreground">2 slips need inspection</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <Users className="h-4 w-4 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New Inquiry</p>
                  <p className="text-xs text-muted-foreground">3 waiting list requests</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

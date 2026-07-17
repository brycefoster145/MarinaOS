"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  BarChart3, TrendingUp, Anchor, Droplets, Warehouse,
  DollarSign, Activity, Download, Calendar, ArrowUpRight, ArrowDownRight,
  Zap, AlertTriangle, Lightbulb
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";

const monthlyRevenue = [
  { month: "Jan", revenue: 38200, expenses: 12000, slips: 28000, fuel: 6200, storage: 2800, services: 1200 },
  { month: "Feb", revenue: 41500, expenses: 11800, slips: 30500, fuel: 6800, storage: 3000, services: 1200 },
  { month: "Mar", revenue: 44800, expenses: 12500, slips: 32800, fuel: 7200, storage: 3200, services: 1600 },
  { month: "Apr", revenue: 42100, expenses: 12200, slips: 31000, fuel: 6500, storage: 3000, services: 1600 },
  { month: "May", revenue: 46300, expenses: 13000, slips: 33800, fuel: 7500, storage: 3400, services: 1600 },
  { month: "Jun", revenue: 48900, expenses: 12800, slips: 35200, fuel: 8200, storage: 3500, services: 2000 },
  { month: "Jul", revenue: 51200, expenses: 13500, slips: 36800, fuel: 8500, storage: 3700, services: 2200 },
  { month: "Aug", revenue: 48500, expenses: 13200, slips: 34800, fuel: 8000, storage: 3500, services: 2200 },
];

const occupancyData = [
  { month: "Jan", rate: 72, available: 5, occupied: 14 },
  { month: "Feb", rate: 75, available: 4, occupied: 15 },
  { month: "Mar", rate: 78, available: 4, occupied: 15 },
  { month: "Apr", rate: 82, available: 3, occupied: 16 },
  { month: "May", rate: 85, available: 3, occupied: 16 },
  { month: "Jun", rate: 88, available: 2, occupied: 17 },
  { month: "Jul", rate: 92, available: 1, occupied: 18 },
  { month: "Aug", rate: 89, available: 2, occupied: 17 },
];

const fuelData = [
  { month: "Jan", gasoline: 4200, diesel: 2800, premium: 1200 },
  { month: "Feb", gasoline: 4500, diesel: 3100, premium: 1300 },
  { month: "Mar", gasoline: 4800, diesel: 3300, premium: 1400 },
  { month: "Apr", gasoline: 5100, diesel: 3500, premium: 1500 },
  { month: "May", gasoline: 5500, diesel: 3800, premium: 1700 },
  { month: "Jun", gasoline: 6200, diesel: 4200, premium: 2000 },
  { month: "Jul", gasoline: 6800, diesel: 4500, premium: 2200 },
  { month: "Aug", gasoline: 5800, diesel: 4000, premium: 1900 },
];

const revenueByCategory = [
  { name: "Slip Rentals", value: 72, color: "#0284c7" },
  { name: "Fuel Sales", value: 18, color: "#059669" },
  { name: "Dry Storage", value: 8, color: "#d97706" },
  { name: "Services", value: 2, color: "#7c3aed" },
];

const weeklyInsights = [
  { insight: "Weekend occupancy projected at 92% — consider dynamic pricing", type: "warning" as const },
  { insight: "3 customers haven't renewed annual contracts — follow up recommended", type: "info" as const },
  { insight: "Diesel inventory below 25% — schedule delivery", type: "warning" as const },
  { insight: "Summer revenue up 18% compared to last year", type: "success" as const },
  { insight: "Slip A-06 maintenance overdue by 5 days", type: "error" as const },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 text-xs">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.name.includes("Rate") ? `${p.value}%` : formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("revenue");
  const [period, setPeriod] = useState("yearly");

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">Deep insights, forecasting, and performance reports</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="MRR" value={formatCurrency(51200)} change="+8.1%" changeType="positive" icon={<DollarSign className="h-4 w-4" />} />
          <StatsCard label="Occupancy Rate" value="89%" change="+3.2%" changeType="positive" icon={<Anchor className="h-4 w-4" />} />
          <StatsCard label="Avg. Daily Rate" value="$185" change="+$12" changeType="positive" icon={<TrendingUp className="h-4 w-4" />} />
          <StatsCard label="Customer Retention" value="94%" change="+2.1%" changeType="positive" icon={<Activity className="h-4 w-4" />} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="revenue">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="occupancy">
              <Anchor className="h-4 w-4 mr-2" />
              Occupancy
            </TabsTrigger>
            <TabsTrigger value="fuel">
              <Droplets className="h-4 w-4 mr-2" />
              Fuel
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue and expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenue}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke="#0284c7" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                        <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} name="Expenses" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={revenueByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                            {revenueByCategory.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {revenueByCategory.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </span>
                          <span className="font-medium">{cat.value}%</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-medium">
                        <span>Total</span>
                        <span>{formatCurrency(361500)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Occupancy Tab */}
          <TabsContent value="occupancy" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Occupancy Rate</CardTitle>
                  <CardDescription>Monthly slip utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="rate" fill="#0284c7" radius={[4, 4, 0, 0]} name="Occupancy Rate" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Slip Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">Total Slips</p>
                        <p className="text-xs text-muted-foreground">Across 3 docks</p>
                      </div>
                      <span className="text-2xl font-bold font-display">19</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5">
                      <div>
                        <p className="text-sm font-medium">Available</p>
                        <p className="text-xs text-muted-foreground">Ready to rent</p>
                      </div>
                      <span className="text-2xl font-bold font-display text-green-500">2</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5">
                      <div>
                        <p className="text-sm font-medium">Occupied</p>
                        <p className="text-xs text-muted-foreground">Currently rented</p>
                      </div>
                      <span className="text-2xl font-bold font-display text-blue-500">17</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5">
                      <div>
                        <p className="text-sm font-medium">Seasonal Trend</p>
                        <p className="text-xs text-muted-foreground">Peak: July (92%)</p>
                      </div>
                      <span className="text-sm font-medium text-yellow-500">+18%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fuel Tab */}
          <TabsContent value="fuel" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Fuel Sales by Type</CardTitle>
                  <CardDescription>Monthly fuel volume (gallons)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fuelData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="gasoline" fill="#0284c7" radius={[4, 4, 0, 0]} name="Gasoline" stackId="a" />
                        <Bar dataKey="diesel" fill="#059669" radius={[4, 4, 0, 0]} name="Diesel" stackId="a" />
                        <Bar dataKey="premium" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Premium" stackId="a" />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fuel Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Gasoline</span>
                        <span className="text-muted-foreground">4,200 / 10,000 gal</span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: "42%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Diesel</span>
                        <span className="text-muted-foreground">2,100 / 8,000 gal</span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-green-500" style={{ width: "26%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Premium Gas</span>
                        <span className="text-muted-foreground">1,800 / 5,000 gal</span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: "36%" }} />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Revenue</span>
                        <span className="font-medium">{formatCurrency(65200)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    AI-Generated Insights
                  </CardTitle>
                  <CardDescription>Automated analysis and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weeklyInsights.map((item, i) => {
                      const colors = {
                        warning: "bg-yellow-500/5 border-yellow-500/10 text-yellow-500",
                        info: "bg-blue-500/5 border-blue-500/10 text-blue-500",
                        success: "bg-green-500/5 border-green-500/10 text-green-500",
                        error: "bg-red-500/5 border-red-500/10 text-red-500",
                      };
                      const icons = {
                        warning: AlertTriangle,
                        info: Lightbulb,
                        success: TrendingUp,
                        error: AlertTriangle,
                      };
                      const Icon = icons[item.type];
                      return (
                        <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${colors[item.type]}`}>
                          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{item.insight}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.type === "warning" ? "Action recommended" :
                               item.type === "info" ? "Information" :
                               item.type === "success" ? "Positive trend" : "Requires attention"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Forecasting
                  </CardTitle>
                  <CardDescription>Next month predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <p className="text-xs text-muted-foreground">Projected Revenue</p>
                      <p className="text-2xl font-bold font-display mt-1">{formatCurrency(53500)}</p>
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        +4.5% vs last month
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <p className="text-xs text-muted-foreground">Projected Occupancy</p>
                      <p className="text-2xl font-bold font-display mt-1">91%</p>
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        +2% vs last month
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <p className="text-xs text-muted-foreground">Anomaly Detection</p>
                      <p className="text-sm font-medium mt-1 text-green-500">No anomalies detected</p>
                      <p className="text-xs text-muted-foreground mt-1">All metrics within normal ranges</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
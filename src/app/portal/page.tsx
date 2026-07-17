"use client";

import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { GlassCard } from "@/components/ui/glass-card";
import { StatsCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Ship, Anchor, CreditCard, FileText, Wrench, Plus,
  Calendar, MessageCircle, Bell, Menu, X,
  Search, Send, DollarSign, Download, Upload, Sparkles
} from "lucide-react";

// Sample portal data
const portalCustomer = {
  firstName: "Robert",
  lastName: "Chen",
  email: "robert.chen@example.com",
  memberSince: "2024-01-15",
};

const portalReservations = [
  { id: "r1", slipName: "A-03", startDate: "2025-08-01", endDate: "2025-08-15", status: "CONFIRMED" as const, amount: 2550 },
  { id: "r2", slipName: "A-03", startDate: "2025-07-01", endDate: "2025-07-15", status: "CHECKED_OUT" as const, amount: 2550 },
  { id: "r3", slipName: "B-07", startDate: "2025-06-01", endDate: "2025-06-10", status: "CHECKED_OUT" as const, amount: 1700 },
];

const portalInvoices = [
  { id: "i1", number: "INV-2025-001", amount: 2550, dueDate: "2025-07-15", status: "PAID" as const },
  { id: "i2", number: "INV-2025-008", amount: 2550, dueDate: "2025-08-15", status: "PENDING" as const },
];

const availableSlips = [
  { id: "s1", name: "A-02", length: 45, dailyRate: 170 },
  { id: "s2", name: "B-04", length: 50, dailyRate: 200 },
  { id: "s3", name: "C-01", length: 30, dailyRate: 120 },
];

const statusBadge: Record<string, "info" | "success" | "default" | "warning"> = {
  CONFIRMED: "info", CHECKED_OUT: "default", CHECKED_IN: "success", PENDING: "warning", PAID: "success",
};

export default function PortalPage() {
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background">
        {/* Portal Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Ship className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-display font-bold">MarinaOS</span>
                <span className="text-[10px] text-muted-foreground ml-2">Customer Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              </button>
              <Avatar firstName={portalCustomer.firstName} lastName={portalCustomer.lastName} size="sm" />
              <div className="hidden sm:block text-sm">
                <p className="font-medium">{portalCustomer.firstName} {portalCustomer.lastName}</p>
                <p className="text-xs text-muted-foreground">Member since {formatDate(portalCustomer.memberSince)}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Welcome Banner */}
          <GlassCard className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold">
                  Welcome back, {portalCustomer.firstName}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your reservations, pay invoices, and more — all in one place.
                </p>
              </div>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Make a Reservation
              </Button>
            </div>
          </GlassCard>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Active Reservations" value="1" icon={<Calendar className="h-4 w-4" />} />
            <StatsCard label="Upcoming Arrival" value="Aug 1" icon={<Ship className="h-4 w-4" />} />
            <StatsCard label="Outstanding Balance" value={formatCurrency(2550)} icon={<DollarSign className="h-4 w-4" />} />
            <StatsCard label="Total Spent (YTD)" value={formatCurrency(6800)} icon={<CreditCard className="h-4 w-4" />} />
          </div>

          {/* Main content tabs */}
          <Tabs defaultValue="reservations">
            <TabsList>
              <TabsTrigger value="reservations">
                <Calendar className="h-4 w-4 mr-2" />
                Reservations
              </TabsTrigger>
              <TabsTrigger value="billing">
                <DollarSign className="h-4 w-4 mr-2" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance
              </TabsTrigger>
            </TabsList>

            {/* Reservations Tab */}
            <TabsContent value="reservations" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current & Upcoming</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {portalReservations.filter(r => r.status !== "CHECKED_OUT").map((res) => (
                        <div key={res.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                          <div className="flex items-center gap-3">
                            <Anchor className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Slip {res.slipName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(res.startDate)} - {formatDate(res.endDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={statusBadge[res.status]} className="text-[10px]">{res.status.replace("_", " ")}</Badge>
                          </div>
                        </div>
                      ))}
                      {portalReservations.filter(r => r.status !== "CHECKED_OUT").length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No upcoming reservations</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Available Slips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {availableSlips.map((slip) => (
                        <div key={slip.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                          <div className="flex items-center gap-3">
                            <Ship className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Slip {slip.name}</p>
                              <p className="text-xs text-muted-foreground">{slip.length}&apos;</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(slip.dailyRate)}<span className="text-xs text-muted-foreground">/day</span></p>
                            <Button size="sm" variant="outline" className="h-7 text-xs mt-1">Reserve</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Reservation History */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Reservation History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {portalReservations.map((res) => (
                        <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                          <div className="flex items-center gap-3">
                            <Anchor className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Slip {res.slipName}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(res.startDate)} - {formatDate(res.endDate)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={statusBadge[res.status]} className="text-[10px]">{res.status.replace("_", " ")}</Badge>
                            <p className="text-xs font-medium mt-0.5">{formatCurrency(res.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {portalInvoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                          <div>
                            <p className="font-medium">{inv.number}</p>
                            <p className="text-xs text-muted-foreground">Due: {formatDate(inv.dueDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(inv.amount)}</p>
                            <Badge variant={statusBadge[inv.status]} className="text-[10px]">{inv.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">•••• 4242</p>
                            <p className="text-xs text-muted-foreground">Expires 12/26</p>
                          </div>
                        </div>
                        <Badge variant="success" className="text-[10px]">Default</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Auto-Pay Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                      <div>
                        <p className="font-medium">Auto-Pay</p>
                        <p className="text-xs text-muted-foreground">Automatically pay invoices when they&apos;re due</p>
                      </div>
                      <Button variant={true ? "default" : "outline"} size="sm">
                        {true ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Insurance Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Boat Insurance - M/Y Serenity</p>
                            <p className="text-xs text-muted-foreground">BoatUS · Expires Dec 31, 2025</p>
                          </div>
                        </div>
                        <Badge variant="success" className="text-[10px]">Verified</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Insurance
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Registration Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">Vessel Registration</p>
                            <p className="text-xs text-muted-foreground">M/Y Serenity · USCG Doc #1234567</p>
                          </div>
                        </div>
                        <Badge variant="info" className="text-[10px]">On File</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Wrench className="h-6 w-6 text-primary" />
                        <span className="text-sm">Electrical Issue</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Wrench className="h-6 w-6 text-yellow-500" />
                        <span className="text-sm">Plumbing / Water</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Ship className="h-6 w-6 text-blue-500" />
                        <span className="text-sm">Dock Structure</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Wrench className="h-6 w-6 text-red-500" />
                        <span className="text-sm">Other Issue</span>
                      </Button>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Describe the issue</label>
                      <textarea
                        className="w-full min-h-[100px] rounded-xl border border-border bg-background p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Describe what needs to be repaired or inspected..."
                      />
                    </div>
                    <Button className="w-full">Submit Request</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* AI Chat Button */}
        <div className="fixed bottom-6 right-6 z-50">
          {chatOpen ? (
            <GlassCard className="w-[360px] h-[500px] flex flex-col shadow-2xl" hover={false}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">AI Assistant</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-secondary/50 rounded-2xl rounded-tl-none p-3 text-sm">
                      Hi! I&apos;m your AI assistant. I can help you with reservations, billing questions, and more.
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Just now</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="flex-1 max-w-[80%]">
                    <div className="bg-primary/10 rounded-2xl rounded-tr-none p-3 text-sm">
                      What slips are available next week?
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">You</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-secondary/50 rounded-2xl rounded-tl-none p-3 text-sm">
                      I can see that Slips A-02, B-04, and C-01 are available next week. Would you like to reserve any of these?
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Just now</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask anything..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="icon" className="h-10 w-10">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ) : (
            <button
              onClick={() => setChatOpen(true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
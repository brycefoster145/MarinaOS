"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BoatManager } from "@/components/customers/boat-manager";
import { Mail, Phone, MapPin, Calendar, Anchor, DollarSign, FileText, ArrowLeft, Ship, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  memberSince: string;
  totalSpent: number;
  notes: string | null;
  isActive: boolean;
  boats: any[];
  reservations: any[];
  invoices: any[];
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${params.id}`);
        if (res.ok) {
          const json = await res.json();
          setCustomer(json.data || json);
        }
      } catch (e) {
        console.error("Failed to load customer", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [params.id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!customer) {
    return (
      <AppShell>
        <div className="p-4 sm:p-6 lg:p-8">
          <Link href="/customers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Customer not found</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const nextReservation = customer.reservations.find(r => r.status === "CONFIRMED");

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Back button */}
        <Link href="/customers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>

        {/* Customer Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Avatar firstName={customer.firstName} lastName={customer.lastName} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-display font-bold">
                {customer.firstName} {customer.lastName}
              </h1>
              <Badge variant={customer.isActive ? "success" : "secondary"} className="text-xs">
                {customer.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Member since {formatDate(customer.memberSince)}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Spent" value={formatCurrency(customer.totalSpent)} icon={<DollarSign className="h-4 w-4" />} />
          <StatsCard label="Active Boats" value={customer.boats.length.toString()} icon={<Ship className="h-4 w-4" />} />
          <StatsCard label="Reservations" value={customer.reservations.length.toString()} icon={<Calendar className="h-4 w-4" />} />
          <StatsCard label="Next Visit" value={nextReservation ? formatDate(nextReservation.startDate) : "None"} icon={<Calendar className="h-4 w-4" />} />
        </div>

        {/* Contact Info */}
        <GlassCard className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{customer.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">
                  {[customer.address, customer.city, customer.state].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">{formatDate(customer.memberSince)}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="boats">Boats & Insurance</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reservation History */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.reservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No reservations yet</p>
                  ) : (
                    <div className="space-y-3">
                      {customer.reservations.slice(0, 3).map((res) => (
                        <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                          <div className="flex items-center gap-3">
                            <Anchor className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Slip {res.slipName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(res.startDate)} - {formatDate(res.endDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={res.status === "CONFIRMED" ? "info" : "default"} className="text-[10px]">
                              {res.status.replace("_", " ")}
                            </Badge>
                            <p className="text-xs font-medium mt-1">{formatCurrency(res.totalAmount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{customer.notes || "No notes yet"}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="boats" className="mt-6">
            <BoatManager
              boats={customer.boats}
              onAddBoat={() => {}}
              onDeleteBoat={() => {}}
              onAddInsurance={() => {}}
            />
          </TabsContent>

          <TabsContent value="reservations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Reservation History</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No reservations yet</p>
                ) : (
                  <div className="space-y-3">
                    {customer.reservations.map((res) => (
                      <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <Anchor className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Slip {res.slipName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(res.startDate)} - {formatDate(res.endDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={res.status === "CONFIRMED" ? "info" : res.status === "CHECKED_OUT" ? "default" : "warning"} className="text-[10px]">
                            {res.status.replace("_", " ")}
                          </Badge>
                          <p className="text-xs font-medium mt-1">{formatCurrency(res.totalAmount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice History</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No invoices yet</p>
                ) : (
                  <div className="space-y-3">
                    {customer.invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                        <div>
                          <p className="text-sm font-medium">{inv.number}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(inv.date)}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={inv.status === "PAID" ? "success" : "warning"} className="text-[10px]">
                            {inv.status}
                          </Badge>
                          <p className="text-xs font-medium mt-1">{formatCurrency(inv.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Download className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalClose } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Warehouse, Plus, Calendar, Ship, ArrowUpDown, DollarSign, Users } from "lucide-react";

const storageRacks = [
  { id: "r1", name: "Rack A-1", location: "Building A", capacity: 12, occupied: 10, status: "AVAILABLE" as const },
  { id: "r2", name: "Rack A-2", location: "Building A", capacity: 12, occupied: 12, status: "FULL" as const },
  { id: "r3", name: "Rack B-1", location: "Building B", capacity: 8, occupied: 5, status: "AVAILABLE" as const },
  { id: "r4", name: "Rack B-2", location: "Building B", capacity: 8, occupied: 8, status: "FULL" as const },
  { id: "r5", name: "Rack C-1", location: "Building C", capacity: 6, occupied: 3, status: "AVAILABLE" as const },
];

const storageReservations = [
  { id: "sr1", customer: "Robert Chen", boat: "M/Y Serenity", rack: "Rack A-1", startDate: "2025-07-01", endDate: "2025-09-30", status: "ACTIVE" as const, amount: 2400 },
  { id: "sr2", customer: "Sarah Miller", boat: "S/V Wind Dancer", rack: "Rack A-2", startDate: "2025-06-01", endDate: "2025-08-31", status: "ACTIVE" as const, amount: 1800 },
  { id: "sr3", customer: "Emily Davis", boat: "M/Y Aquarius", rack: "Rack B-1", startDate: "2025-08-01", endDate: "2025-10-31", status: "PENDING" as const, amount: 2100 },
  { id: "sr4", customer: "James Wilson", boat: "Weekender", rack: "Rack C-1", startDate: "2025-05-01", endDate: "2025-07-31", status: "COMPLETED" as const, amount: 1200 },
];

export default function DryStoragePage() {
  const [activeTab, setActiveTab] = useState("racks");
  const [showReservation, setShowReservation] = useState(false);

  const totalCapacity = storageRacks.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied = storageRacks.reduce((s, r) => s + r.occupied, 0);
  const occupancyRate = Math.round((totalOccupied / totalCapacity) * 100);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Dry Storage</h1>
            <p className="text-muted-foreground mt-1">Manage rack storage, reservations, and launch scheduling</p>
          </div>
          <Button size="sm" onClick={() => setShowReservation(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Reservation
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Capacity" value={`${totalCapacity} racks`} icon={<Warehouse className="h-4 w-4" />} />
          <StatsCard label="Occupied" value={`${totalOccupied} racks`} icon={<Warehouse className="h-4 w-4" />} />
          <StatsCard label="Occupancy Rate" value={`${occupancyRate}%`} icon={<ArrowUpDown className="h-4 w-4" />} />
          <StatsCard label="Active Reservations" value={storageReservations.filter(r => r.status === "ACTIVE").length.toString()} icon={<Calendar className="h-4 w-4" />} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="racks">
              <Warehouse className="h-4 w-4 mr-2" />
              Racks
            </TabsTrigger>
            <TabsTrigger value="reservations">
              <Calendar className="h-4 w-4 mr-2" />
              Reservations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="racks" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storageRacks.map((rack) => {
                const pct = Math.round((rack.occupied / rack.capacity) * 100);
                return (
                  <GlassCard key={rack.id} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-display font-semibold">{rack.name}</h3>
                        <p className="text-xs text-muted-foreground">{rack.location}</p>
                      </div>
                      <Badge variant={rack.status === "AVAILABLE" ? "success" : "warning"} className="text-xs">
                        {rack.occupied}/{rack.capacity}
                      </Badge>
                    </div>
                    <div className="h-3 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 100 ? "bg-yellow-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>{rack.occupied} occupied</span>
                      <span>{rack.capacity - rack.occupied} available</span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Boat</TableHead>
                        <TableHead>Rack</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storageReservations.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell className="font-medium">{res.customer}</TableCell>
                          <TableCell>{res.boat}</TableCell>
                          <TableCell>{res.rack}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(res.startDate)} - {formatDate(res.endDate)}
                          </TableCell>
                          <TableCell>{formatCurrency(res.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={res.status === "ACTIVE" ? "success" : res.status === "PENDING" ? "warning" : "default"} className="text-xs">
                              {res.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Modal open={showReservation} onOpenChange={setShowReservation}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>New Storage Reservation</ModalTitle>
              <ModalDescription>Create a dry storage reservation</ModalDescription>
            </ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Customer</label>
                <Select><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="robert">Robert Chen</SelectItem>
                  <SelectItem value="sarah">Sarah Miller</SelectItem>
                  <SelectItem value="emily">Emily Davis</SelectItem>
                </SelectContent></Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Rack</label>
                <Select><SelectTrigger><SelectValue placeholder="Select rack" /></SelectTrigger>
                <SelectContent>
                  {storageRacks.filter(r => r.status === "AVAILABLE").map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({r.capacity - r.occupied} available)</SelectItem>
                  ))}
                </SelectContent></Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Start Date</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">End Date</label>
                  <Input type="date" />
                </div>
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button>Create Reservation</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </AppShell>
  );
}
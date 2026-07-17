"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveSlipMap } from "@/components/slips/interactive-slip-map";
import { SlipListView } from "@/components/slips/slip-list-view";
import { ReservationCalendar, NewReservationModal } from "@/components/slips/reservation-manager";
import { Anchor, Map, Table2, Calendar, Plus, Ship } from "lucide-react";

// Sample data
const sampleDocks = [
  {
    id: "dock-1",
    name: "Alpha Dock",
    color: "#0284c7",
    slips: [
      { id: "s1", name: "A-01", number: "A-01", length: 40, width: 14, maxDraft: 6, hasPower: true, hasWater: true, hasWiFi: true, hasCable: false, status: "OCCUPIED" as const, positionX: 50, positionY: 120, widthPixels: 75, heightPixels: 32, rotation: 0, dockId: "dock-1", dockName: "Alpha Dock" },
      { id: "s2", name: "A-02", number: "A-02", length: 45, width: 15, maxDraft: 6.5, hasPower: true, hasWater: true, hasWiFi: true, hasCable: false, status: "AVAILABLE" as const, positionX: 140, positionY: 120, widthPixels: 80, heightPixels: 32, rotation: 0, dockId: "dock-1", dockName: "Alpha Dock" },
      { id: "s3", name: "A-03", number: "A-03", length: 50, width: 16, maxDraft: 7, hasPower: true, hasWater: true, hasWiFi: true, hasCable: true, status: "RESERVED" as const, positionX: 230, positionY: 120, widthPixels: 85, heightPixels: 32, rotation: 0, dockId: "dock-1", dockName: "Alpha Dock" },
      { id: "s4", name: "A-04", number: "A-04", length: 55, width: 17, maxDraft: 7, hasPower: true, hasWater: true, hasWiFi: true, hasCable: false, status: "OCCUPIED" as const, positionX: 320, positionY: 120, widthPixels: 90, heightPixels: 32, rotation: 0, dockId: "dock-1", dockName: "Alpha Dock" },
      { id: "s5", name: "A-05", number: "A-05", length: 60, width: 18, maxDraft: 8, hasPower: true, hasWater: true, hasWiFi: true, hasCable: true, status: "AVAILABLE" as const, positionX: 410, positionY: 120, widthPixels: 95, heightPixels: 32, rotation: 0, dockId: "dock-1", dockName: "Alpha Dock" },
      { id: "s6", name: "A-06", number: "A-06", length: 65, width: 19, maxDraft: 8.5, hasPower: true, hasWater: true, hasWiFi: true, hasCable: false, status: "MAINTENANCE" as const, positionX: 500, positionY: 120, widthPixels: 100, heightPixels: 32, rotation: 0, dockId: "dock-1", dockName: "Alpha Dock" },
    ],
  },
  {
    id: "dock-2",
    name: "Bravo Dock",
    color: "#059669",
    slips: [
      { id: "s7", name: "B-01", number: "B-01", length: 35, width: 13, maxDraft: 5, hasPower: true, hasWater: true, hasWiFi: true, hasCable: false, status: "OCCUPIED" as const, positionX: 50, positionY: 240, widthPixels: 70, heightPixels: 30, rotation: 0, dockId: "dock-2", dockName: "Bravo Dock" },
      { id: "s8", name: "B-02", number: "B-02", length: 40, width: 14, maxDraft: 6, hasPower: true, hasWater: true, hasWiFi: true, hasCable: false, status: "AVAILABLE" as const, positionX: 140, positionY: 240, widthPixels: 75, heightPixels: 30, rotation: 0, dockId: "dock-2", dockName: "Bravo Dock" },
      { id: "s9", name: "B-03", number: "B-03", length: 45, width: 15, maxDraft: 6.5, hasPower: true, hasWater: true, hasWiFi: true, hasCable: true, status: "OCCUPIED" as const, positionX: 230, positionY: 240, widthPixels: 80, heightPixels: 30, rotation: 0, dockId: "dock-2", dockName: "Bravo Dock" },
      { id: "s10", name: "B-04", number: "B-04", length: 50, width: 16, maxDraft: 7, hasPower: true, hasWater: true, hasWiFi: true, hasCable: false, status: "AVAILABLE" as const, positionX: 320, positionY: 240, widthPixels: 85, heightPixels: 30, rotation: 0, dockId: "dock-2", dockName: "Bravo Dock" },
    ],
  },
  {
    id: "dock-3",
    name: "Charlie Dock",
    color: "#d97706",
    slips: [
      { id: "s11", name: "C-01", number: "C-01", length: 30, width: 12, maxDraft: 4.5, hasPower: true, hasWater: true, hasWiFi: false, hasCable: false, status: "AVAILABLE" as const, positionX: 50, positionY: 360, widthPixels: 65, heightPixels: 28, rotation: 0, dockId: "dock-3", dockName: "Charlie Dock" },
      { id: "s12", name: "C-02", number: "C-02", length: 35, width: 13, maxDraft: 5, hasPower: true, hasWater: true, hasWiFi: false, hasCable: false, status: "RESERVED" as const, positionX: 140, positionY: 360, widthPixels: 70, heightPixels: 28, rotation: 0, dockId: "dock-3", dockName: "Charlie Dock" },
      { id: "s13", name: "C-03", number: "C-03", length: 40, width: 14, maxDraft: 6, hasPower: true, hasWater: true, hasWiFi: false, hasCable: true, status: "OCCUPIED" as const, positionX: 230, positionY: 360, widthPixels: 75, heightPixels: 28, rotation: 0, dockId: "dock-3", dockName: "Charlie Dock" },
    ],
  },
];

const sampleSlips = sampleDocks.flatMap(d => d.slips.map(s => ({
  ...s,
  dockName: d.name,
  monthlyRate: s.length * 2.5,
  customerName: s.status === "OCCUPIED" ? ["Robert Chen", "Sarah Miller", "James Wilson"][Math.floor(Math.random() * 3)] : null,
  boatName: s.status === "OCCUPIED" ? ["M/Y Serenity", "S/V Wind Dancer", "M/Y Aquarius"][Math.floor(Math.random() * 3)] : null,
  reservationEnd: s.status === "OCCUPIED" ? "2025-08-15" : null,
})));

const sampleReservations = [
  { id: "r1", slipName: "A-03", customerName: "Robert Chen", boatName: "M/Y Serenity", startDate: "2025-08-01", endDate: "2025-08-15", status: "CONFIRMED" as const, totalAmount: 2550 },
  { id: "r2", slipName: "C-02", customerName: "Sarah Miller", boatName: "S/V Wind Dancer", startDate: "2025-08-05", endDate: "2025-08-12", status: "CONFIRMED" as const, totalAmount: 1400 },
  { id: "r3", slipName: "A-01", customerName: "James Wilson", boatName: "M/Y Aquarius", startDate: "2025-08-10", endDate: "2025-08-20", status: "PENDING" as const, totalAmount: 3000 },
];

export default function SlipsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [activeTab, setActiveTab] = useState("map");

  const totalSlips = sampleSlips.length;
  const availableSlips = sampleSlips.filter(s => s.status === "AVAILABLE").length;
  const occupiedSlips = sampleSlips.filter(s => s.status === "OCCUPIED").length;
  const occupancyRate = Math.round((occupiedSlips / totalSlips) * 100);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Slips & Docks</h1>
            <p className="text-muted-foreground mt-1">Manage your marina slips, docks, and reservations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveTab("calendar")}>
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button size="sm" onClick={() => setShowNewReservation(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Slips" value={totalSlips.toString()} icon={<Anchor className="h-4 w-4" />} />
          <StatsCard label="Available" value={availableSlips.toString()} icon={<Ship className="h-4 w-4" />} />
          <StatsCard label="Occupied" value={occupiedSlips.toString()} change={`${occupancyRate}%`} changeType="neutral" icon={<Ship className="h-4 w-4" />} />
          <StatsCard label="Occupancy Rate" value={`${occupancyRate}%`} change={availableSlips > 0 ? "+3.2%" : "-2.1%"} changeType={availableSlips > 0 ? "positive" : "negative"} icon={<Anchor className="h-4 w-4" />} />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="map">
              <Map className="h-4 w-4 mr-2" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="list">
              <Table2 className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            <GlassCard className="p-0 overflow-hidden" hover={false}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-display font-semibold">Interactive Marina Map</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Available</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Occupied</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Reserved</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Maintenance</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <InteractiveSlipMap
                  docks={sampleDocks}
                  onSlipClick={(slip) => setSelectedSlip(slip)}
                  selectedSlipId={selectedSlip?.id}
                />
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <GlassCard className="p-5" hover={false}>
              <SlipListView
                slips={sampleSlips}
                onReserve={(id) => setShowNewReservation(true)}
                onMaintenance={(id) => setSelectedSlip(sampleSlips.find(s => s.id === id))}
                onView={(id) => setSelectedSlip(sampleSlips.find(s => s.id === id))}
              />
            </GlassCard>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <GlassCard className="p-5" hover={false}>
              <ReservationCalendar
                reservations={sampleReservations}
                onNewReservation={() => setShowNewReservation(true)}
                onCheckIn={(id) => console.log("Check in:", id)}
                onCheckOut={(id) => console.log("Check out:", id)}
                onCancel={(id) => console.log("Cancel:", id)}
              />
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* New Reservation Modal */}
        <NewReservationModal
          open={showNewReservation}
          onOpenChange={setShowNewReservation}
          availableSlips={sampleSlips.filter(s => s.status === "AVAILABLE").map(s => ({ id: s.id, name: s.name }))}
          onSubmit={(data) => console.log("New reservation:", data)}
        />
      </div>
    </AppShell>
  );
}
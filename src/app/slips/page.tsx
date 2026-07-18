"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveSlipMap } from "@/components/slips/interactive-slip-map";
import { SlipListView } from "@/components/slips/slip-list-view";
import { ReservationCalendar, NewReservationModal } from "@/components/slips/reservation-manager";
import { SatelliteDockDetection } from "@/components/slips/satellite-dock-detection";
import { Anchor, Map, Table2, Calendar, Plus, Ship, Satellite } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SlipStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "UNAVAILABLE";

interface SlipData {
  id: string; name: string; number: string; length: number;
  width: number | null; maxDraft: number | null;
  hasPower: boolean; hasWater: boolean; hasWiFi: boolean; hasCable: boolean;
  status: SlipStatus;
  positionX: number | null; positionY: number | null;
  widthPixels: number | null; heightPixels: number | null; rotation: number | null;
  dockId: string; dockName?: string;
}

interface DockData {
  id: string; name: string; color: string; slips: SlipData[];
}

export default function SlipsPage() {
  const [docks, setDocks] = useState<DockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [activeTab, setActiveTab] = useState("map");

  useEffect(() => {
    async function fetchSlips() {
      try {
        const res = await fetch("/api/slips");
        if (res.ok) {
          const json = await res.json();
          setDocks(json.data || []);
        }
      } catch (e) {
        console.error("Failed to load slips", e);
      } finally {
        setLoading(false);
      }
    }
    fetchSlips();
  }, []);

  const allSlips = docks.flatMap(d => d.slips.map(s => ({
    id: s.id, name: s.name, dockName: d.name, length: s.length,
    width: s.width, status: s.status, monthlyRate: null,
    customerName: null, boatName: null, reservationEnd: null,
  })));

  const totalSlips = allSlips.length;
  const availableSlips = allSlips.filter(s => s.status === "AVAILABLE").length;
  const occupiedSlips = allSlips.filter(s => s.status === "OCCUPIED").length;
  const occupancyRate = totalSlips > 0 ? Math.round((occupiedSlips / totalSlips) * 100) : 0;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Slips & Docks</h1>
            <p className="text-muted-foreground mt-1">Manage your marina slips, docks, and reservations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveTab("calendar")}>
              <Calendar className="h-4 w-4 mr-2" /> Calendar
            </Button>
            <Button size="sm" onClick={() => setShowNewReservation(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Reservation
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Slips" value={totalSlips.toString()} icon={<Anchor className="h-4 w-4" />} />
            <StatsCard label="Available" value={availableSlips.toString()} icon={<Ship className="h-4 w-4" />} />
            <StatsCard label="Occupied" value={occupiedSlips.toString()} change={`${occupancyRate}%`} changeType="neutral" icon={<Ship className="h-4 w-4" />} />
            <StatsCard label="Occupancy Rate" value={`${occupancyRate}%`} change="0%" changeType="neutral" icon={<Anchor className="h-4 w-4" />} />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="map"><Map className="h-4 w-4 mr-2" /> Map View</TabsTrigger>
            <TabsTrigger value="list"><Table2 className="h-4 w-4 mr-2" /> List View</TabsTrigger>
            <TabsTrigger value="calendar"><Calendar className="h-4 w-4 mr-2" /> Calendar</TabsTrigger>
            <TabsTrigger value="satellite"><Satellite className="h-4 w-4 mr-2" /> Satellite</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            <GlassCard className="p-0 overflow-hidden" hover={false}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-semibold">Interactive Marina Map</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Available</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Occupied</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Reserved</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Maintenance</span>
                </div>
              </div>
              <div className="p-6">
                {loading ? <Skeleton className="h-80 rounded-2xl" /> : (
                  <InteractiveSlipMap docks={docks} onSlipClick={(slip) => setSelectedSlip(slip)} selectedSlipId={selectedSlip?.id} />
                )}
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <GlassCard className="p-5" hover={false}>
              {loading ? <Skeleton className="h-60 rounded-2xl" /> : (
                <SlipListView slips={allSlips as any} onReserve={(id) => setShowNewReservation(true)}
                  onMaintenance={(id) => setSelectedSlip(allSlips.find(s => s.id === id))}
                  onView={(id) => setSelectedSlip(allSlips.find(s => s.id === id))} />
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <GlassCard className="p-5" hover={false}>
              {loading ? <Skeleton className="h-60 rounded-2xl" /> : (
                <ReservationCalendar reservations={[]} onNewReservation={() => setShowNewReservation(true)}
                  onCheckIn={(id) => console.log("Check in:", id)} onCheckOut={(id) => console.log("Check out:", id)}
                  onCancel={(id) => console.log("Cancel:", id)} />
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="satellite" className="mt-6">
            <GlassCard className="p-5" hover={false}>
              <SatelliteDockDetection />
            </GlassCard>
          </TabsContent>
        </Tabs>

        <NewReservationModal open={showNewReservation} onOpenChange={setShowNewReservation}
          availableSlips={allSlips.filter(s => s.status === "AVAILABLE").map(s => ({ id: s.id, name: s.name }))}
          onSubmit={(data) => console.log("New reservation:", data)} />
      </div>
    </AppShell>
  );
}

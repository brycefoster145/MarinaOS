"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalClose } from "@/components/ui/modal";
import { Anchor, Calendar, User, Ship, Check, X } from "lucide-react";

interface Reservation {
  id: string;
  slipName: string;
  customerName: string;
  boatName: string | null;
  startDate: string;
  endDate: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  totalAmount: number | null;
}

const reservationStatusBadge: Record<string, "warning" | "info" | "success" | "default" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  CHECKED_IN: "success",
  CHECKED_OUT: "default",
  CANCELLED: "danger",
};

interface ReservationCalendarProps {
  reservations: Reservation[];
  onNewReservation?: () => void;
  onCheckIn?: (id: string) => void;
  onCheckOut?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function ReservationCalendar({
  reservations,
  onNewReservation,
  onCheckIn,
  onCheckOut,
  onCancel,
}: ReservationCalendarProps) {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Group reservations by date
  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return date;
  });

  const reservationsByDate = next7Days.map((date) => {
    const dateStr = date.toISOString().split("T")[0];
    const dayReservations = reservations.filter((r) => {
      const start = r.startDate.split("T")[0];
      const end = r.endDate.split("T")[0];
      return start <= dateStr && end >= dateStr;
    });
    return { date, reservations: dayReservations };
  });

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold">Upcoming Reservations</h3>
        <Button size="sm" onClick={onNewReservation}>
          <Calendar className="h-4 w-4 mr-2" />
          New Reservation
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
        {reservationsByDate.map(({ date, reservations: dayReservations }) => (
          <GlassCard key={date.toISOString()} className="p-3 min-h-[120px]" hover={false}>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {formatDate(date)}
            </p>
            <div className="space-y-1.5">
              {dayReservations.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/50">No reservations</p>
              ) : (
                dayReservations.slice(0, 3).map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setSelectedReservation(res)}
                    className="w-full text-left p-1.5 rounded-md bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <p className="text-[10px] font-medium truncate">{res.customerName}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{res.slipName}</p>
                  </button>
                ))
              )}
              {dayReservations.length > 3 && (
                <p className="text-[10px] text-muted-foreground">+{dayReservations.length - 3} more</p>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Reservation Detail Modal */}
      <Modal open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
        <ModalContent className="sm:max-w-md">
          <ModalHeader>
            <ModalTitle>Reservation Details</ModalTitle>
            <ModalDescription>
              {selectedReservation?.slipName} · {selectedReservation?.customerName}
            </ModalDescription>
          </ModalHeader>

          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Start</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedReservation.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30">
                  <p className="text-xs text-muted-foreground">End</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedReservation.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <Ship className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedReservation.boatName || "No boat"}</p>
                  <p className="text-xs text-muted-foreground">Boat</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={reservationStatusBadge[selectedReservation.status]}>
                  {selectedReservation.status.replace("_", " ")}
                </Badge>
                {selectedReservation.totalAmount && (
                  <span className="text-sm font-medium ml-auto">
                    ${Number(selectedReservation.totalAmount).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}

          <ModalFooter className="gap-2">
            {selectedReservation?.status === "CONFIRMED" && (
              <Button onClick={() => { onCheckIn?.(selectedReservation.id); setSelectedReservation(null); }}>
                <Check className="h-4 w-4 mr-2" />
                Check In
              </Button>
            )}
            {selectedReservation?.status === "CHECKED_IN" && (
              <Button onClick={() => { onCheckOut?.(selectedReservation.id); setSelectedReservation(null); }}>
                <Ship className="h-4 w-4 mr-2" />
                Check Out
              </Button>
            )}
            {(selectedReservation?.status === "PENDING" || selectedReservation?.status === "CONFIRMED") && (
              <Button
                variant="destructive"
                onClick={() => { onCancel?.(selectedReservation.id); setSelectedReservation(null); }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <ModalClose asChild>
              <Button variant="outline">Close</Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

interface NewReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableSlips: { id: string; name: string }[];
  onSubmit: (data: {
    slipId: string;
    customerId: string;
    startDate: string;
    endDate: string;
    boatName: string;
  }) => void;
}

export function NewReservationModal({ open, onOpenChange, availableSlips, onSubmit }: NewReservationModalProps) {
  const [slipId, setSlipId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [boatName, setBoatName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    onSubmit({ slipId, customerId: customerName, startDate, endDate, boatName });
    onOpenChange(false);
    setSlipId("");
    setCustomerName("");
    setBoatName("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <ModalTitle>New Reservation</ModalTitle>
          <ModalDescription>Create a new slip reservation</ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Slip</label>
            <Select value={slipId} onValueChange={setSlipId}>
              <SelectTrigger>
                <SelectValue placeholder="Select slip" />
              </SelectTrigger>
              <SelectContent>
                {availableSlips.map((slip) => (
                  <SelectItem key={slip.id} value={slip.id}>{slip.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Customer Name</label>
            <Input
              placeholder="Search or enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Boat Name (optional)</label>
            <Input
              placeholder="Boat name"
              value={boatName}
              onChange={(e) => setBoatName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Cancel</Button>
          </ModalClose>
          <Button onClick={handleSubmit} disabled={!slipId || !customerName || !startDate || !endDate}>
            Create Reservation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
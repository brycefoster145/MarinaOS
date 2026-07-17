"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, Eye, Wrench, Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type SlipStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "UNAVAILABLE";

interface SlipListRow {
  id: string;
  name: string;
  dockName: string;
  length: number;
  width: number | null;
  status: SlipStatus;
  monthlyRate: number | null;
  customerName?: string | null;
  boatName?: string | null;
  reservationEnd?: string | null;
}

const statusBadge: Record<SlipStatus, "success" | "info" | "warning" | "danger" | "outline"> = {
  AVAILABLE: "success",
  OCCUPIED: "info",
  RESERVED: "warning",
  MAINTENANCE: "danger",
  UNAVAILABLE: "outline",
};

interface SlipListViewProps {
  slips: SlipListRow[];
  onReserve?: (slipId: string) => void;
  onMaintenance?: (slipId: string) => void;
  onView?: (slipId: string) => void;
}

export function SlipListView({ slips, onReserve, onMaintenance, onView }: SlipListViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dockFilter, setDockFilter] = useState<string>("all");

  const filteredSlips = slips.filter((slip) => {
    const matchesSearch = slip.name.toLowerCase().includes(search.toLowerCase()) ||
      slip.dockName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || slip.status === statusFilter;
    const matchesDock = dockFilter === "all" || slip.dockName === dockFilter;
    return matchesSearch && matchesStatus && matchesDock;
  });

  const uniqueDocks = [...new Set(slips.map(s => s.dockName))];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search slips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="OCCUPIED">Occupied</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dockFilter} onValueChange={setDockFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Docks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Docks</SelectItem>
            {uniqueDocks.map((dock) => (
              <SelectItem key={dock} value={dock}>{dock}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slip</TableHead>
              <TableHead>Dock</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSlips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No slips found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredSlips.map((slip) => (
                <TableRow key={slip.id}>
                  <TableCell>
                    <span className="font-medium">{slip.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{slip.dockName}</TableCell>
                  <TableCell>
                    {slip.length}&apos;{slip.width ? ` × ${slip.width}'` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[slip.status]} className="text-xs">
                      {slip.status.charAt(0) + slip.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {slip.monthlyRate ? `$${Number(slip.monthlyRate).toLocaleString()}/mo` : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{slip.customerName || "—"}</span>
                    {slip.boatName && (
                      <span className="text-xs text-muted-foreground block">{slip.boatName}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {slip.status === "AVAILABLE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onReserve?.(slip.id)}
                          title="Reserve"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      )}
                      {slip.status === "OCCUPIED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onView?.(slip.id)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onMaintenance?.(slip.id)}
                        title="Maintenance"
                      >
                        <Wrench className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{filteredSlips.length} slips shown</span>
        <span className="w-2 h-2 rounded-full bg-green-500/50" />
        <span>{slips.filter(s => s.status === "AVAILABLE").length} available</span>
        <span className="w-2 h-2 rounded-full bg-blue-500/50" />
        <span>{slips.filter(s => s.status === "OCCUPIED").length} occupied</span>
      </div>
    </div>
  );
}
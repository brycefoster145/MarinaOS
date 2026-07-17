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
import { formatDate } from "@/lib/utils";
import {
  Wrench, Plus, AlertTriangle, Clock, CheckCircle,
  Users, Calendar, ClipboardList, AlertCircle, FileText
} from "lucide-react";

const maintenanceRequests = [
  { id: "mr1", title: "Electrical inspection - Slip A-06", slip: "A-06", priority: "HIGH" as const, status: "PENDING" as const, requestedBy: "Robert Chen", createdAt: "2025-07-28", description: "Power pedestal not functioning on slip A-06. No power to dock box." },
  { id: "mr2", title: "Dock box repair - Slip C-03", slip: "C-03", priority: "MEDIUM" as const, status: "IN_PROGRESS" as const, requestedBy: "Sarah Miller", createdAt: "2025-07-25", description: "Hinge broken on dock box, door won't close properly." },
  { id: "mr3", title: "Water pressure check - Alpha Dock", slip: "A-01", priority: "LOW" as const, status: "PENDING" as const, requestedBy: "Staff", createdAt: "2025-07-30", description: "Low water pressure reported on Alpha Dock spigots." },
  { id: "mr4", title: "Fuel pump calibration", slip: null, priority: "URGENT" as const, status: "COMPLETED" as const, requestedBy: "Fuel Dock", createdAt: "2025-07-26", description: "Fuel pump #2 reading inaccurately. Needs calibration." },
  { id: "mr5", title: "Security light replacement", slip: "B-04", priority: "MEDIUM" as const, status: "PENDING" as const, requestedBy: "Staff", createdAt: "2025-07-29", description: "Security light at Bravo Dock entrance not working." },
];

const workOrders = [
  { id: "wo1", title: "Slip A-06 Electrical Repair", assignedTo: "Mike Johnson", priority: "HIGH" as const, status: "IN_PROGRESS" as const, dueDate: "2025-08-03", estimatedHours: 4, actualHours: 2 },
  { id: "wo2", title: "Dock Box Repairs", assignedTo: "Tom Chen", priority: "MEDIUM" as const, status: "PENDING" as const, dueDate: "2025-08-05", estimatedHours: 2, actualHours: 0 },
  { id: "wo3", title: "Fuel Pump Calibration", assignedTo: "Mike Johnson", priority: "URGENT" as const, status: "COMPLETED" as const, dueDate: "2025-07-28", estimatedHours: 3, actualHours: 2.5 },
  { id: "wo4", title: "Water Pressure Investigation", assignedTo: "Unassigned", priority: "LOW" as const, status: "PENDING" as const, dueDate: "2025-08-10", estimatedHours: 2, actualHours: 0 },
];

const priorityBadge: Record<string, "danger" | "warning" | "info" | "default" | "success"> = {
  URGENT: "danger", HIGH: "warning", MEDIUM: "info", LOW: "default",
  PENDING: "warning", IN_PROGRESS: "info", COMPLETED: "success", CANCELLED: "default",
};

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState("requests");
  const [showRequest, setShowRequest] = useState(false);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Maintenance</h1>
            <p className="text-muted-foreground mt-1">Work orders, inspections, and service requests</p>
          </div>
          <Button size="sm" onClick={() => setShowRequest(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Open Requests" value={maintenanceRequests.filter(r => r.status !== "COMPLETED").length.toString()} icon={<ClipboardList className="h-4 w-4" />} />
          <StatsCard label="In Progress" value={workOrders.filter(w => w.status === "IN_PROGRESS").length.toString()} icon={<Wrench className="h-4 w-4" />} />
          <StatsCard label="Urgent" value={maintenanceRequests.filter(r => r.priority === "URGENT" && r.status !== "COMPLETED").length.toString()} change="Needs attention" changeType="negative" icon={<AlertTriangle className="h-4 w-4" />} />
          <StatsCard label="Completed (30d)" value={maintenanceRequests.filter(r => r.status === "COMPLETED").length.toString()} icon={<CheckCircle className="h-4 w-4" />} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="requests">
              <ClipboardList className="h-4 w-4 mr-2" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="workorders">
              <Wrench className="h-4 w-4 mr-2" />
              Work Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Slip</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.title}</TableCell>
                          <TableCell>{req.slip || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={priorityBadge[req.priority]} className="text-xs">{req.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={priorityBadge[req.status]} className="text-xs">{req.status.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{req.requestedBy}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(req.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workorders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workOrders.map((wo) => (
                        <TableRow key={wo.id}>
                          <TableCell className="font-medium">{wo.title}</TableCell>
                          <TableCell>{wo.assignedTo}</TableCell>
                          <TableCell>
                            <Badge variant={priorityBadge[wo.priority]} className="text-xs">{wo.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={priorityBadge[wo.status]} className="text-xs">{wo.status.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(wo.dueDate)}</TableCell>
                          <TableCell className="text-sm">{wo.actualHours}/{wo.estimatedHours}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Modal open={showRequest} onOpenChange={setShowRequest}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>New Maintenance Request</ModalTitle>
              <ModalDescription>Submit a maintenance request</ModalDescription>
            </ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title</label>
                <Input placeholder="Brief description of the issue" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Slip (optional)</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select slip" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (General)</SelectItem>
                    {["A-01","A-02","A-03","B-01","B-02","C-01","C-02","C-03"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Priority</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea className="w-full min-h-[100px] rounded-xl border border-border bg-background p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Describe the issue in detail..." />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button>Submit Request</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </AppShell>
  );
}
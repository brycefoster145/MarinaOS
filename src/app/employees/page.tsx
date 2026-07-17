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
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import {
  Users, UserPlus, Calendar, Shield, Clock,
  Phone, Mail, BadgeCheck, Wrench, Activity
} from "lucide-react";

const employees = [
  { id: "e1", firstName: "Mike", lastName: "Johnson", email: "mike.j@marinaos.com", phone: "(949) 555-1001", role: "MANAGER" as const, position: "Harbor Master", department: "Operations", isActive: true, startedAt: "2023-03-15", workOrdersCompleted: 48 },
  { id: "e2", firstName: "Sarah", lastName: "Williams", email: "sarah.w@marinaos.com", phone: "(949) 555-1002", role: "EMPLOYEE" as const, position: "Dock Hand", department: "Operations", isActive: true, startedAt: "2024-01-10", workOrdersCompleted: 32 },
  { id: "e3", firstName: "Tom", lastName: "Chen", email: "tom.c@marinaos.com", phone: "(949) 555-1003", role: "EMPLOYEE" as const, position: "Maintenance Tech", department: "Maintenance", isActive: true, startedAt: "2023-06-01", workOrdersCompleted: 56 },
  { id: "e4", firstName: "Emily", lastName: "Rodriguez", email: "emily.r@marinaos.com", phone: "(949) 555-1004", role: "ADMIN" as const, position: "Office Manager", department: "Administration", isActive: true, startedAt: "2022-11-01", workOrdersCompleted: 0 },
  { id: "e5", firstName: "Dave", lastName: "Park", email: "dave.p@marinaos.com", phone: "(949) 555-1005", role: "EMPLOYEE" as const, position: "Fuel Dock Attendant", department: "Fuel Dock", isActive: false, startedAt: "2024-02-01", endedAt: "2025-06-30", workOrdersCompleted: 15 },
];

const roleBadge: Record<string, "info" | "default" | "success" | "warning"> = {
  ADMIN: "info", MANAGER: "success", EMPLOYEE: "default", SUPER_ADMIN: "warning",
};

const schedule = [
  { day: "Mon", employees: ["Mike J.", "Sarah W.", "Tom C.", "Emily R."] },
  { day: "Tue", employees: ["Mike J.", "Tom C.", "Emily R."] },
  { day: "Wed", employees: ["Mike J.", "Sarah W.", "Tom C.", "Emily R."] },
  { day: "Thu", employees: ["Mike J.", "Sarah W.", "Tom C."] },
  { day: "Fri", employees: ["Mike J.", "Sarah W.", "Tom C.", "Emily R."] },
  { day: "Sat", employees: ["Sarah W.", "Tom C."] },
  { day: "Sun", employees: ["Sarah W."] },
];

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState("directory");
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const activeEmployees = employees.filter(e => e.isActive).length;
  const totalWorkOrders = employees.reduce((s, e) => s + e.workOrdersCompleted, 0);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground mt-1">Manage staff, roles, and scheduling</p>
          </div>
          <Button size="sm" onClick={() => setShowAddEmployee(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Employees" value={employees.length.toString()} icon={<Users className="h-4 w-4" />} />
          <StatsCard label="Active" value={activeEmployees.toString()} change={`${Math.round((activeEmployees / employees.length) * 100)}%`} changeType="positive" icon={<BadgeCheck className="h-4 w-4" />} />
          <StatsCard label="Departments" value="4" icon={<Shield className="h-4 w-4" />} />
          <StatsCard label="Work Orders Done" value={totalWorkOrders.toString()} icon={<Wrench className="h-4 w-4" />} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="directory">
              <Users className="h-4 w-4 mr-2" />
              Directory
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <GlassCard key={emp.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={emp.firstName} lastName={emp.lastName} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                          {!emp.isActive && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{emp.position}</p>
                      </div>
                    </div>
                    <Badge variant={roleBadge[emp.role]} className="text-[10px]">{emp.role}</Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{emp.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-3.5 w-3.5" />
                      <span>{emp.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Started {formatDate(emp.startedAt)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Wrench className="h-3 w-3" /> {emp.workOrdersCompleted} completed</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Current week staffing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                  {schedule.map((day) => (
                    <GlassCard key={day.day} className="p-4" hover={false}>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{day.day}</p>
                      <div className="space-y-1.5">
                        {day.employees.map((name) => (
                          <div key={name} className="flex items-center gap-2 p-1.5 rounded-md bg-secondary/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-xs">{name}</span>
                          </div>
                        ))}
                        {day.employees.length === 0 && (
                          <p className="text-xs text-muted-foreground">No staff</p>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Modal open={showAddEmployee} onOpenChange={setShowAddEmployee}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Add Employee</ModalTitle>
              <ModalDescription>Add a new team member</ModalDescription>
            </ModalHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">First Name</label>
                  <Input placeholder="First name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Last Name</label>
                  <Input placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input type="email" placeholder="email@marinaos.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone</label>
                <Input type="tel" placeholder="(555) 123-4567" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Role</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Department</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="fuel">Fuel Dock</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Position</label>
                <Input placeholder="Job title" />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button>Add Employee</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </AppShell>
  );
}
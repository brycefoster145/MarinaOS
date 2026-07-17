"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalClose } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { CustomerTable } from "@/components/customers/customer-table";
import { Users, UserPlus, Ship, DollarSign, TrendingUp } from "lucide-react";

// Sample data
const sampleCustomers = [
  { id: "c1", firstName: "Robert", lastName: "Chen", email: "robert.chen@example.com", phone: "(949) 555-0123", boatCount: 2, totalSpent: 28450, lastVisit: "2025-07-15", status: "active" as const },
  { id: "c2", firstName: "Sarah", lastName: "Miller", email: "sarah.miller@example.com", phone: "(949) 555-0456", boatCount: 1, totalSpent: 15200, lastVisit: "2025-07-10", status: "active" as const },
  { id: "c3", firstName: "James", lastName: "Wilson", email: "james.wilson@example.com", phone: "(714) 555-0789", boatCount: 1, totalSpent: 8900, lastVisit: "2025-06-28", status: "active" as const },
  { id: "c4", firstName: "Emily", lastName: "Davis", email: "emily.davis@example.com", phone: "(949) 555-0234", boatCount: 3, totalSpent: 42100, lastVisit: "2025-07-18", status: "active" as const },
  { id: "c5", firstName: "Michael", lastName: "Brown", email: "michael.brown@example.com", phone: "(562) 555-0567", boatCount: 1, totalSpent: 3200, lastVisit: "2025-05-20", status: "inactive" as const },
  { id: "c6", firstName: "Jessica", lastName: "Taylor", email: "jessica.taylor@example.com", phone: "(949) 555-0890", boatCount: 2, totalSpent: 18900, lastVisit: "2025-07-12", status: "active" as const },
  { id: "c7", firstName: "David", lastName: "Anderson", email: "david.anderson@example.com", phone: "(714) 555-0124", boatCount: 1, totalSpent: 6700, lastVisit: "2025-06-05", status: "active" as const },
  { id: "c8", firstName: "Lisa", lastName: "Martinez", email: "lisa.martinez@example.com", phone: "(949) 555-0457", boatCount: 2, totalSpent: 25600, lastVisit: "2025-07-14", status: "active" as const },
];

export default function CustomersPage() {
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  const totalCustomers = sampleCustomers.length;
  const activeCustomers = sampleCustomers.filter(c => c.status === "active").length;
  const totalBoats = sampleCustomers.reduce((sum, c) => sum + c.boatCount, 0);
  const totalRevenue = sampleCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const handleAddCustomer = () => {
    console.log("Add customer:", newCustomer);
    setShowAddCustomer(false);
    setNewCustomer({ firstName: "", lastName: "", email: "", phone: "" });
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage boat owners, members, and their vessels</p>
          </div>
          <Button size="sm" onClick={() => setShowAddCustomer(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Customers" value={totalCustomers.toString()} icon={<Users className="h-4 w-4" />} />
          <StatsCard label="Active" value={activeCustomers.toString()} change={`${Math.round((activeCustomers / totalCustomers) * 100)}%`} changeType="positive" icon={<Users className="h-4 w-4" />} />
          <StatsCard label="Total Boats" value={totalBoats.toString()} icon={<Ship className="h-4 w-4" />} />
          <StatsCard label="Total Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}K`} change="+12.5%" changeType="positive" icon={<DollarSign className="h-4 w-4" />} />
        </div>

        {/* Customer Table */}
        <GlassCard className="p-5" hover={false}>
          <CustomerTable
            customers={sampleCustomers}
            onAddCustomer={() => setShowAddCustomer(true)}
          />
        </GlassCard>

        {/* Add Customer Modal */}
        <Modal open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <ModalContent className="sm:max-w-md">
            <ModalHeader>
              <ModalTitle>Add Customer</ModalTitle>
              <ModalDescription>Add a new customer to your marina</ModalDescription>
            </ModalHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">First Name</label>
                  <Input
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Last Name</label>
                  <Input
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone</label>
                <Input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="outline">Cancel</Button>
              </ModalClose>
              <Button onClick={handleAddCustomer} disabled={!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email}>
                Add Customer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </AppShell>
  );
}
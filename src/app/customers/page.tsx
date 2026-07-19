"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalClose } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { CustomerTable } from "@/components/customers/customer-table";
import { Users, UserPlus, Ship, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  boatCount: number;
  totalSpent: number | null;
  lastVisit: string | null;
  status: "active" | "inactive";
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (res.ok) {
          const json = await res.json();
          setCustomers(json.data || json || []);
        }
      } catch (e) {
        console.error("Failed to load customers", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === "active").length;
  const totalBoats = customers.reduce((sum, c) => sum + c.boatCount, 0);

  const handleAddCustomer = async () => {
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email) {
      toast.error("First name, last name, and email are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      const json = await res.json();
      setCustomers((prev) => [json.data || json, ...prev]);
      setShowAddCustomer(false);
      setNewCustomer({ firstName: "", lastName: "", email: "", phone: "" });
      toast.success("Customer added successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to add customer");
    } finally {
      setSaving(false);
    }
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
          <StatsCard label="Active" value={activeCustomers.toString()} change={totalCustomers > 0 ? `${Math.round((activeCustomers / totalCustomers) * 100)}%` : "—"} changeType="positive" icon={<Users className="h-4 w-4" />} />
          <StatsCard label="Total Boats" value={totalBoats.toString()} icon={<Ship className="h-4 w-4" />} />
          <StatsCard label="Total Revenue" value="$0" icon={<DollarSign className="h-4 w-4" />} />
        </div>

        {/* Customer Table */}
        <GlassCard className="p-5" hover={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CustomerTable
              customers={customers}
              onAddCustomer={() => setShowAddCustomer(true)}
            />
          )}
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
                <label className="text-sm font-medium mb-1.5 block">Phone (optional)</label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="(949) 555-0000"
                />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="outline">Cancel</Button>
              </ModalClose>
              <Button onClick={handleAddCustomer} loading={saving}>
                {saving ? "Saving..." : "Add Customer"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </AppShell>
  );
}
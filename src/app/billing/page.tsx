"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalClose } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign, CreditCard, FileText, TrendingUp,
  Download, Plus, Eye, Calendar, AlertTriangle, Check,
  ArrowUpRight, ArrowDownRight, Receipt, BarChart3
} from "lucide-react";

// Sample data
const invoices = [
  { id: "inv-1", number: "INV-2025-001", customer: "Robert Chen", amount: 2550, status: "PAID" as const, dueDate: "2025-07-15", paidAt: "2025-07-10", items: [{ desc: "Slip A-03 (Jul 1-15)", qty: 15, rate: 170 }] },
  { id: "inv-2", number: "INV-2025-002", customer: "Sarah Miller", amount: 1400, status: "PAID" as const, dueDate: "2025-07-20", paidAt: "2025-07-18", items: [{ desc: "Slip C-02 (Jul 5-12)", qty: 7, rate: 200 }] },
  { id: "inv-3", number: "INV-2025-003", customer: "James Wilson", amount: 3000, status: "OVERDUE" as const, dueDate: "2025-07-01", paidAt: null, items: [{ desc: "Slip A-01 (Monthly)", qty: 1, rate: 3000 }] },
  { id: "inv-4", number: "INV-2025-004", customer: "Emily Davis", amount: 5100, status: "PAID" as const, dueDate: "2025-08-01", paidAt: "2025-07-28", items: [{ desc: "Slip B-03 (Aug Monthly)", qty: 1, rate: 3600 }, { desc: "Fuel Dock - Diesel", qty: 100, rate: 15 }] },
  { id: "inv-5", number: "INV-2025-005", customer: "Jessica Taylor", amount: 850, status: "DRAFT" as const, dueDate: "2025-08-15", paidAt: null, items: [{ desc: "Slip A-05 (Aug 1-5)", qty: 5, rate: 170 }] },
  { id: "inv-6", number: "INV-2025-006", customer: "Lisa Martinez", amount: 2200, status: "PAID" as const, dueDate: "2025-07-25", paidAt: "2025-07-23", items: [{ desc: "Slip B-01 (Monthly)", qty: 1, rate: 2200 }] },
  { id: "inv-7", number: "INV-2025-007", customer: "David Anderson", amount: 1800, status: "OVERDUE" as const, dueDate: "2025-06-30", paidAt: null, items: [{ desc: "Slip C-03 (Jun Monthly)", qty: 1, rate: 1800 }] },
];

const payments = [
  { id: "p1", invoice: "INV-2025-001", customer: "Robert Chen", amount: 2550, method: "CREDIT_CARD" as const, date: "2025-07-10", status: "SUCCEEDED" as const },
  { id: "p2", invoice: "INV-2025-002", customer: "Sarah Miller", amount: 1400, method: "ACH" as const, date: "2025-07-18", status: "SUCCEEDED" as const },
  { id: "p3", invoice: "INV-2025-004", customer: "Emily Davis", amount: 5100, method: "CREDIT_CARD" as const, date: "2025-07-28", status: "SUCCEEDED" as const },
  { id: "p4", invoice: "INV-2025-006", customer: "Lisa Martinez", amount: 2200, method: "CHECK" as const, date: "2025-07-23", status: "SUCCEEDED" as const },
  { id: "p5", invoice: "INV-2025-003", customer: "James Wilson", amount: 3000, method: "CREDIT_CARD" as const, date: "2025-08-01", status: "PENDING" as const },
];

const monthlyRevenue = [
  { month: "Jan", revenue: 38200, expenses: 12000 },
  { month: "Feb", revenue: 41500, expenses: 11800 },
  { month: "Mar", revenue: 44800, expenses: 12500 },
  { month: "Apr", revenue: 42100, expenses: 12200 },
  { month: "May", revenue: 46300, expenses: 13000 },
  { month: "Jun", revenue: 48900, expenses: 12800 },
  { month: "Jul", revenue: 51200, expenses: 13500 },
  { month: "Aug", revenue: 48500, expenses: 13200 },
];

const statusVariant: Record<string, "success" | "warning" | "danger" | "default" | "info"> = {
  PAID: "success", DRAFT: "default", OVERDUE: "danger", SENT: "info", CANCELLED: "outline" as any,
  SUCCEEDED: "success", PENDING: "warning", FAILED: "danger",
  CREDIT_CARD: "info", ACH: "default", CHECK: "default", CASH: "default",
};

const activeSubscription = {
  plan: "MarinaOS Pro",
  status: "ACTIVE",
  price: 150000,
  interval: "month",
  trialEnds: null,
  currentPeriodEnd: "2025-09-01",
  cancelAtPeriodEnd: false,
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [showInvoice, setShowInvoice] = useState<any>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const outstandingBalance = invoices.filter(i => i.status === "OVERDUE").reduce((s, i) => s + i.amount, 0);
  const paidInvoices = invoices.filter(i => i.status === "PAID").length;
  const overdueCount = invoices.filter(i => i.status === "OVERDUE").length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Billing</h1>
            <p className="text-muted-foreground mt-1">Manage invoices, payments, subscription, and revenue</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setShowCreateInvoice(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Revenue (YTD)" value={formatCurrency(totalRevenue)} change="+12.5%" changeType="positive" icon={<DollarSign className="h-4 w-4" />} />
          <StatsCard label="Outstanding" value={formatCurrency(outstandingBalance)} icon={<AlertTriangle className="h-4 w-4" />} />
          <StatsCard label="Paid Invoices" value={paidInvoices.toString()} icon={<Receipt className="h-4 w-4" />} />
          <StatsCard label="Overdue" value={overdueCount.toString()} change="needs attention" changeType={overdueCount > 0 ? "negative" : "positive"} icon={<AlertTriangle className="h-4 w-4" />} />
        </div>

        {/* Subscription Card */}
        <GlassCard className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-lg">{activeSubscription.plan}</h3>
                  <Badge variant="success" className="text-xs">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(activeSubscription.price / 100)}/{activeSubscription.interval}
                  {activeSubscription.cancelAtPeriodEnd && " · Cancels at period end"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                View Plan Details
              </Button>
              <Button size="sm">Manage Subscription</Button>
            </div>
          </div>
        </GlassCard>

        {/* Tabs: Invoices | Payments | Revenue */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="invoices">
              <FileText className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <BarChart3 className="h-4 w-4 mr-2" />
              Revenue Analytics
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Invoices</CardTitle>
                <CardDescription>Manage and track all invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.number}</TableCell>
                          <TableCell>{inv.customer}</TableCell>
                          <TableCell>{formatCurrency(inv.amount)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[inv.status] || "default"} className="text-xs">
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowInvoice(inv)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All recorded payments</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowPaymentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-muted-foreground">{formatDate(p.date)}</TableCell>
                          <TableCell className="font-medium">{p.invoice}</TableCell>
                          <TableCell>{p.customer}</TableCell>
                          <TableCell>{formatCurrency(p.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[p.method] || "default"} className="text-xs">
                              {p.method.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[p.status] || "default"} className="text-xs">
                              {p.status}
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

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Monthly revenue vs expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end gap-2">
                    {monthlyRevenue.map((m) => {
                      const maxRevenue = Math.max(...monthlyRevenue.map(r => r.revenue));
                      const revHeight = (m.revenue / maxRevenue) * 100;
                      const expHeight = (m.expenses / maxRevenue) * 100;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex flex-col items-center gap-0.5">
                            <div
                              className="w-full rounded-t bg-primary/60 transition-all hover:bg-primary/80"
                              style={{ height: `${revHeight * 0.6}px` }}
                              title={`Revenue: ${formatCurrency(m.revenue)}`}
                            />
                            <div
                              className="w-full rounded-t bg-muted-foreground/30 transition-all hover:bg-muted-foreground/50"
                              style={{ height: `${expHeight * 0.4}px` }}
                              title={`Expenses: ${formatCurrency(m.expenses)}`}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/60" /> Revenue</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted-foreground/30" /> Expenses</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {invoices.filter(i => i.status === "OVERDUE").map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5">
                          <div>
                            <p className="text-sm font-medium">{inv.customer}</p>
                            <p className="text-xs text-muted-foreground">{inv.number}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-destructive">{formatCurrency(inv.amount)}</p>
                            <Badge variant="danger" className="text-[10px]">Overdue</Badge>
                          </div>
                        </div>
                      ))}
                      {invoices.filter(i => i.status === "OVERDUE").length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No outstanding balances</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Credit Card</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500" /> ACH</span>
                        <span className="font-medium">20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-yellow-500" /> Check</span>
                        <span className="font-medium">10%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /> Cash</span>
                        <span className="font-medium">5%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Invoice Detail Modal */}
        <Modal open={!!showInvoice} onOpenChange={(o) => !o && setShowInvoice(null)}>
          <ModalContent className="sm:max-w-lg">
            {showInvoice && (
              <>
                <ModalHeader>
                  <ModalTitle>{showInvoice.number}</ModalTitle>
                  <ModalDescription>{showInvoice.customer}</ModalDescription>
                </ModalHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">{formatDate(showInvoice.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={statusVariant[showInvoice.status] || "default"}>{showInvoice.status}</Badge>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {showInvoice.items.map((item: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>{item.desc}</TableCell>
                            <TableCell>{item.qty}</TableCell>
                            <TableCell>{formatCurrency(item.rate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.qty * item.rate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold font-display">{formatCurrency(showInvoice.amount)}</p>
                    </div>
                  </div>
                </div>
                <ModalFooter>
                  <ModalClose asChild><Button variant="outline">Close</Button></ModalClose>
                  {showInvoice.status === "OVERDUE" && <Button variant="destructive">Send Reminder</Button>}
                  {showInvoice.status !== "PAID" && <Button>Mark as Paid</Button>}
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Create Invoice Modal */}
        <Modal open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>New Invoice</ModalTitle>
              <ModalDescription>Create a manual invoice</ModalDescription>
            </ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Customer</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="robert">Robert Chen</SelectItem>
                    <SelectItem value="sarah">Sarah Miller</SelectItem>
                    <SelectItem value="james">James Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount</label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Due Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Input placeholder="Invoice description" />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button>Create Invoice</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Record Payment Modal */}
        <Modal open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Record Payment</ModalTitle>
              <ModalDescription>Record a payment against an invoice</ModalDescription>
            </ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Invoice</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                  <SelectContent>
                    {invoices.filter(i => i.status !== "PAID").map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.number} - {inv.customer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount</label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Method</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Payment Date</label>
                <Input type="date" />
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button>Record Payment</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </AppShell>
  );
}
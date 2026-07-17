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
import {
  Droplets, Fuel, Plus, TrendingUp, AlertTriangle,
  DollarSign, Calendar, Download, BarChart3, Ship, Gauge
} from "lucide-react";

const fuelInventory = [
  { type: "Gasoline", tankName: "Tank A", currentLevel: 4200, capacity: 10000, unit: "gallons", pricePerUnit: 4.50, costPerUnit: 3.20, lastDelivery: "2025-07-25", status: "NORMAL" as const },
  { type: "Diesel", tankName: "Tank B", currentLevel: 2100, capacity: 8000, unit: "gallons", pricePerUnit: 5.20, costPerUnit: 3.80, lastDelivery: "2025-07-20", status: "LOW" as const },
  { type: "Premium Gas", tankName: "Tank C", currentLevel: 1800, capacity: 5000, unit: "gallons", pricePerUnit: 5.80, costPerUnit: 4.10, lastDelivery: "2025-07-28", status: "NORMAL" as const },
];

const fuelSales = [
  { id: "fs1", date: "2025-08-01", type: "Diesel", quantity: 150, unitPrice: 5.20, total: 780, customer: "M/Y Serenity", paymentMethod: "CREDIT_CARD" },
  { id: "fs2", date: "2025-08-01", type: "Gasoline", quantity: 80, unitPrice: 4.50, total: 360, customer: "S/V Wind Dancer", paymentMethod: "ACH" },
  { id: "fs3", date: "2025-07-31", type: "Premium Gas", quantity: 60, unitPrice: 5.80, total: 348, customer: "M/Y Aquarius", paymentMethod: "CREDIT_CARD" },
  { id: "fs4", date: "2025-07-31", type: "Diesel", quantity: 200, unitPrice: 5.20, total: 1040, customer: "Harbor Ferry", paymentMethod: "CHECK" },
  { id: "fs5", date: "2025-07-30", type: "Gasoline", quantity: 100, unitPrice: 4.50, total: 450, customer: "Weekend Warrior", paymentMethod: "CASH" },
];

export default function FuelDockPage() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [showSaleModal, setShowSaleModal] = useState(false);

  const totalSales = fuelSales.reduce((s, f) => s + f.total, 0);
  const lowFuel = fuelInventory.filter(f => f.status === "LOW").length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Fuel Dock</h1>
            <p className="text-muted-foreground mt-1">Manage fuel inventory, pricing, and sales</p>
          </div>
          <Button size="sm" onClick={() => setShowSaleModal(true)}>
            <Fuel className="h-4 w-4 mr-2" />
            Record Sale
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Sales (30d)" value={formatCurrency(totalSales)} change="+12.5%" changeType="positive" icon={<DollarSign className="h-4 w-4" />} />
          <StatsCard label="Gallons Sold" value="590" icon={<Droplets className="h-4 w-4" />} />
          <StatsCard label="Active Tanks" value="3" icon={<Gauge className="h-4 w-4" />} />
          <StatsCard label="Low Inventory Alerts" value={lowFuel.toString()} change={lowFuel > 0 ? "Needs attention" : "All good"} changeType={lowFuel > 0 ? "negative" : "positive"} icon={<AlertTriangle className="h-4 w-4" />} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="inventory">
              <Gauge className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="sales">
              <DollarSign className="h-4 w-4 mr-2" />
              Sales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fuelInventory.map((fuel) => {
                const pct = Math.round((fuel.currentLevel / fuel.capacity) * 100);
                const gaugeColor = pct > 50 ? "bg-green-500" : pct > 25 ? "bg-yellow-500" : "bg-red-500";
                return (
                  <GlassCard key={fuel.type} className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Droplets className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold">{fuel.type}</h3>
                          <p className="text-xs text-muted-foreground">{fuel.tankName}</p>
                        </div>
                      </div>
                      <Badge variant={pct > 50 ? "success" : pct > 25 ? "warning" : "danger"} className="text-xs">
                        {pct > 50 ? "Normal" : pct > 25 ? "Low" : "Critical"}
                      </Badge>
                    </div>
                    <div className="h-4 rounded-full bg-secondary overflow-hidden mb-3">
                      <div className={`h-full rounded-full ${gaugeColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Level</span>
                        <p className="font-medium">{fuel.currentLevel.toLocaleString()} / {fuel.capacity.toLocaleString()} {fuel.unit}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sell Price</span>
                        <p className="font-medium">{formatCurrency(fuel.pricePerUnit)}/{fuel.unit.slice(0, -1)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost</span>
                        <p className="font-medium">{formatCurrency(fuel.costPerUnit)}/{fuel.unit.slice(0, -1)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Margin</span>
                        <p className="font-medium text-green-500">{formatCurrency(fuel.pricePerUnit - fuel.costPerUnit)}/{fuel.unit.slice(0, -1)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      Last delivery: {formatDate(fuel.lastDelivery)}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales History</CardTitle>
                <CardDescription>Recent fuel transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="text-muted-foreground">{formatDate(sale.date)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.type === "Diesel" ? "warning" : sale.type === "Gasoline" ? "info" : "default"} className="text-[10px]">
                              {sale.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{sale.quantity} gal</TableCell>
                          <TableCell>{formatCurrency(sale.unitPrice)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(sale.total)}</TableCell>
                          <TableCell>{sale.customer}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{sale.paymentMethod.replace("_", " ")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Modal open={showSaleModal} onOpenChange={setShowSaleModal}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Record Fuel Sale</ModalTitle>
              <ModalDescription>Enter the fuel sale details</ModalDescription>
            </ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fuel Type</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasoline">Gasoline</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="premium">Premium Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Gallons</label>
                <Input type="number" placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Customer / Boat Name</label>
                <Input placeholder="Boat name or customer" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Payment Method</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
              <Button>Record Sale</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </AppShell>
  );
}
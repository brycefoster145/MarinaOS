"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import {
  Settings, Building2, Users, Key, CreditCard, Bot,
  Save, Eye, EyeOff, Copy, Plus, Trash2, Shield,
  RefreshCw, Check, X, Clock, Globe, Mail, Phone
} from "lucide-react";

const orgSettings = {
  name: "Harbor View Marina",
  email: "info@harborviewmarina.com",
  phone: "(555) 123-4567",
  address: "1 Harbor Boulevard",
  city: "Newport Beach",
  state: "CA",
  zipCode: "92660",
  country: "US",
  timezone: "America/Los_Angeles",
  dateFormat: "MM/DD/YYYY",
  currency: "USD",
  taxRate: 8.25,
  paymentTerms: "net30",
  lateFeePercent: 5,
  lateFeeFlat: 25,
  businessHours: { mon: "8:00-18:00", tue: "8:00-18:00", wed: "8:00-18:00", thu: "8:00-18:00", fri: "8:00-18:00", sat: "9:00-17:00", sun: "10:00-16:00" },
};

const teamMembers = [
  { id: "u1", firstName: "Alex", lastName: "Marina", email: "alex@marinaos.com", role: "SUPER_ADMIN", lastLogin: "2025-08-01T09:30:00", status: "active" as const },
  { id: "u2", firstName: "Emily", lastName: "Rodriguez", email: "emily@marinaos.com", role: "ADMIN", lastLogin: "2025-08-01T08:15:00", status: "active" as const },
  { id: "u3", firstName: "Mike", lastName: "Johnson", email: "mike@marinaos.com", role: "MANAGER", lastLogin: "2025-07-31T14:20:00", status: "active" as const },
  { id: "u4", firstName: "Sarah", lastName: "Williams", email: "sarah@marinaos.com", role: "EMPLOYEE", lastLogin: "2025-07-30T10:45:00", status: "active" as const },
  { id: "u5", firstName: "Tom", lastName: "Chen", email: "tom@marinaos.com", role: "EMPLOYEE", lastLogin: "2025-07-28T16:30:00", status: "inactive" as const },
];

const apiKeys = [
  { id: "ak1", name: "Production API Key", key: "ma_sk_live_••••••••••••••••1234", created: "2025-01-15", lastUsed: "2025-08-01", status: "active" as const },
  { id: "ak2", name: "Test Key", key: "ma_sk_test_••••••••••••••••5678", created: "2025-03-01", lastUsed: "2025-07-15", status: "active" as const },
];

const webhooks = [
  { id: "wh1", name: "Reservation Events", url: "https://hooks.example.com/reservations", events: ["reservation.created", "reservation.updated", "reservation.cancelled"], status: "active" as const },
  { id: "wh2", name: "Payment Events", url: "https://hooks.example.com/payments", events: ["payment.succeeded", "payment.failed"], status: "active" as const },
];

const roleBadge: Record<string, "warning" | "info" | "success" | "default"> = {
  SUPER_ADMIN: "warning", ADMIN: "info", MANAGER: "success", EMPLOYEE: "default",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("organization");
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your marina configuration and preferences</p>
          </div>
          <Button size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="organization"><Building2 className="h-4 w-4 mr-2" /> Organization</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" /> Users</TabsTrigger>
            <TabsTrigger value="integrations"><Key className="h-4 w-4 mr-2" /> Integrations</TabsTrigger>
            <TabsTrigger value="billing"><CreditCard className="h-4 w-4 mr-2" /> Billing</TabsTrigger>
            <TabsTrigger value="ai"><Bot className="h-4 w-4 mr-2" /> AI Settings</TabsTrigger>
          </TabsList>

          {/* Organization Settings */}
          <TabsContent value="organization" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Your marina&apos;s public information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{orgSettings.name}</p>
                      <Button variant="outline" size="sm" className="h-7 text-xs mt-1">Change Logo</Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Marina Name</label>
                    <Input defaultValue={orgSettings.name} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Email</label>
                      <Input defaultValue={orgSettings.email} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Phone</label>
                      <Input defaultValue={orgSettings.phone} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Address</label>
                    <Input defaultValue={orgSettings.address} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">City</label>
                      <Input defaultValue={orgSettings.city} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">State</label>
                      <Input defaultValue={orgSettings.state} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">ZIP</label>
                      <Input defaultValue={orgSettings.zipCode} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Hours</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(orgSettings.businessHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-10 capitalize">{day}</span>
                        <Input defaultValue={hours as string} className="flex-1" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Regional Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Timezone</label>
                        <Select defaultValue={orgSettings.timezone}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern</SelectItem>
                            <SelectItem value="America/Chicago">Central</SelectItem>
                            <SelectItem value="America/Denver">Mountain</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Date Format</label>
                        <Select defaultValue={orgSettings.dateFormat}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Currency</label>
                        <Select defaultValue={orgSettings.currency}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Tax Rate (%)</label>
                        <Input type="number" defaultValue={orgSettings.taxRate} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Terms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Terms</label>
                        <Select defaultValue={orgSettings.paymentTerms}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="net15">Net 15</SelectItem>
                            <SelectItem value="net30">Net 30</SelectItem>
                            <SelectItem value="net60">Net 60</SelectItem>
                            <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Late Fee (%)</label>
                        <Input type="number" defaultValue={orgSettings.lateFeePercent} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Flat Fee ($)</label>
                        <Input type="number" defaultValue={orgSettings.lateFeeFlat} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage user roles and access</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                              <div>
                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleBadge[user.role]} className="text-xs">{user.role.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "active" ? "success" : "outline"} className="text-xs">{user.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(user.lastLogin)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Shield className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage API access for integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apiKeys.map((ak) => (
                      <div key={ak.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                        <div>
                          <p className="text-sm font-medium">{ak.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-background px-2 py-0.5 rounded font-mono">
                              {showApiKey === ak.id ? ak.key : ak.key.slice(0, 20) + "••••"}
                            </code>
                            <button onClick={() => setShowApiKey(showApiKey === ak.id ? null : ak.id)} className="text-muted-foreground hover:text-foreground">
                              {showApiKey === ak.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => navigator.clipboard.writeText(ak.key)} className="text-muted-foreground hover:text-foreground">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">Created {formatDate(ak.created)} · Last used {formatDate(ak.lastUsed)}</p>
                        </div>
                        <Badge variant="success" className="text-[10px]">{ak.status}</Badge>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate New Key
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>Send events to external services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {webhooks.map((wh) => (
                      <div key={wh.id} className="p-3 rounded-xl bg-secondary/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{wh.name}</span>
                          <Badge variant="success" className="text-[10px]">{wh.status}</Badge>
                        </div>
                        <code className="text-xs text-muted-foreground block bg-background px-2 py-1 rounded font-mono mb-2">{wh.url}</code>
                        <div className="flex flex-wrap gap-1">
                          {wh.events.map((evt) => (
                            <Badge key={evt} variant="outline" className="text-[10px]">{evt}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Webhook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium">MarinaOS Pro — $1,500/month</p>
                      <p className="text-xs text-muted-foreground mt-1">Next billing date: September 1, 2025</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium">Payment Method</p>
                      <p className="text-xs text-muted-foreground mt-1">Visa •••• 4242 — Expires 12/26</p>
                    </div>
                    <Button variant="outline" size="sm">Update</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium">Invoices</p>
                      <p className="text-xs text-muted-foreground mt-1">View your billing history</p>
                    </div>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Receptionist</CardTitle>
                  <CardDescription>Configure auto-response settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">AI Receptionist</p>
                      <p className="text-xs text-muted-foreground">Automatically respond to common inquiries</p>
                    </div>
                    <Badge variant="success" className="text-xs">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">Smart Scheduling</p>
                      <p className="text-xs text-muted-foreground">AI-assisted reservation scheduling</p>
                    </div>
                    <Badge variant="success" className="text-xs">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">Payment Reminders</p>
                      <p className="text-xs text-muted-foreground">Automated payment follow-ups</p>
                    </div>
                    <Badge variant="success" className="text-xs">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">AI Analytics</p>
                      <p className="text-xs text-muted-foreground">Generate automated insights</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Disabled</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>OpenAI Configuration</CardTitle>
                  <CardDescription>API key and model settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">API Key</label>
                    <div className="flex gap-2">
                      <Input type="password" value="sk-••••••••••••••••••••••••" readOnly className="font-mono" />
                      <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Model</label>
                    <Select defaultValue="gpt-4">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">Usage This Month</p>
                      <p className="text-xs text-muted-foreground">~45,000 tokens used</p>
                    </div>
                    <span className="text-sm font-medium">$0.90</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
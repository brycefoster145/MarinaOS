"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LifeBuoy, Mail, MessageCircle, BookOpen, Search,
  ArrowRight, ExternalLink, HelpCircle, FileText, Video,
  ChevronRight, Sparkles, Send
} from "lucide-react";

const faqs = [
  { q: "How do I create a new reservation?", a: "Navigate to Slips & Docks, select an available slip, and click 'Reserve'. Fill in the customer details and dates." },
  { q: "How do I add a new customer?", a: "Go to Customers and click 'Add Customer'. Fill in their contact information and boat details." },
  { q: "How do I set up billing?", a: "Navigate to Settings > Billing to configure your payment methods and subscription." },
  { q: "How do I invite team members?", a: "Go to Settings > Users and click 'Invite Member'. Enter their email and assign a role." },
  { q: "How do I record a fuel sale?", a: "Navigate to Fuel Dock and click 'Record Sale'. Enter the fuel type, quantity, and customer." },
  { q: "How do I generate reports?", a: "Go to Analytics and use the export feature to download reports in CSV format." },
];

const guides = [
  { title: "Getting Started with MarinaOS", type: "Guide", icon: BookOpen, readTime: "5 min" },
  { title: "Managing Slips & Reservations", type: "Video", icon: Video, readTime: "8 min" },
  { title: "Billing & Invoice Setup", type: "Guide", icon: FileText, readTime: "6 min" },
  { title: "AI Co-Pilot Quick Start", type: "Guide", icon: Sparkles, readTime: "4 min" },
  { title: "Customer Portal Guide", type: "Video", icon: Video, readTime: "7 min" },
  { title: "Fuel Dock Operations", type: "Guide", icon: FileText, readTime: "5 min" },
];

export default function SupportPage() {
  const [search, setSearch] = useState("");

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <LifeBuoy className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">How can we help?</h1>
          <p className="text-muted-foreground mt-2 mb-6">Search our guides, FAQs, or get in touch with our team</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-base rounded-2xl"
            />
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <GlassCard className="p-5 text-center cursor-pointer hover:shadow-lg transition-all">
            <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-medium">Live Chat</p>
            <p className="text-xs text-muted-foreground mt-1">Chat with our team</p>
          </GlassCard>
          <GlassCard className="p-5 text-center cursor-pointer hover:shadow-lg transition-all">
            <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-medium">Email Us</p>
            <p className="text-xs text-muted-foreground mt-1">support@marinaos.com</p>
          </GlassCard>
          <GlassCard className="p-5 text-center cursor-pointer hover:shadow-lg transition-all">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-medium">Documentation</p>
            <p className="text-xs text-muted-foreground mt-1">Read the docs</p>
          </GlassCard>
        </div>

        <Tabs defaultValue="faq">
          <TabsList className="justify-center">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="mt-6 max-w-2xl mx-auto">
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details key={i} className="group rounded-xl border border-border overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <span className="font-medium text-sm">{faq.q}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="p-4 pt-0 border-t border-border">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guides" className="mt-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guides.map((guide, i) => (
                <GlassCard key={i} className="p-4 cursor-pointer hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <guide.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{guide.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{guide.type}</span>
                        <span className="text-[10px] text-muted-foreground">{guide.readTime}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>
                </GlassCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contact" className="mt-6 max-w-lg mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>We typically respond within 2 hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Subject</label>
                  <Input placeholder="Brief description of your issue" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Message</label>
                  <textarea className="w-full min-h-[150px] rounded-xl border border-border bg-background p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Describe your issue in detail..." />
                </div>
                <Button className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
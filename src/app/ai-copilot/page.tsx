"use client";

import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, StatsCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, Send, Bot, User, Zap, BarChart3, MessageCircle,
  Settings, Activity, Clock, CheckCircle, TrendingUp, AlertCircle,
  Lightbulb, RefreshCw, ArrowRight, Copy, ThumbsUp, ThumbsDown
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  "Which customers owe money?",
  "Which slips are available this weekend?",
  "Show revenue this year",
  "Which boats have expired insurance?",
  "Show maintenance due this week",
  "Summarize today's activity",
];

const sampleResponses: Record<string, string> = {
  "Which customers owe money?": "I found **2 customers** with overdue invoices totaling **$4,800**:\n\n• **James Wilson** — $3,000 (INV-2025-003, overdue 16 days)\n• **David Anderson** — $1,800 (INV-2025-007, overdue 30 days)\n\nWould you like me to send payment reminders to these customers?",
  "Which slips are available this weekend?": "This weekend (Aug 2-3), **3 slips** are available:\n\n• **A-02** — 45' ($170/day) — Alpha Dock\n• **B-04** — 50' ($200/day) — Bravo Dock\n• **C-01** — 30' ($120/day) — Charlie Dock\n\nWould you like me to reserve one for a customer?",
  "Show revenue this year": "**Year-to-Date Revenue: $361,500**\n\nMonthly breakdown:\n• Jan: $38,200\n• Feb: $41,500\n• Mar: $44,800\n• Apr: $42,100\n• May: $46,300\n• Jun: $48,900\n• Jul: $51,200\n• Aug: $48,500\n\nRevenue by category:\n• Slip Rentals: 72%\n• Fuel Sales: 18%\n• Dry Storage: 8%\n• Services: 2%",
  "Which boats have expired insurance?": "I found **1 boat** with expired insurance:\n\n• **M/Y Aquarius** (James Wilson) — Slip A-01\n  • Insurance expired June 30, 2025\n  • Provider: Progressive\n  • Policy: POL-98765\n\nWould you like to send a notification to the owner?",
  "Show maintenance due this week": "**Maintenance Due This Week (2 items):**\n\n• **Slip A-06** — Electrical inspection (Priority: High)\n  • Requested: Jul 28\n  • Description: Power pedestal not functioning\n\n• **Slip C-03** — Dock box repair (Priority: Medium)\n  • Requested: Jul 30\n  • Description: Hinge broken on dock box\n\nI can schedule these for you if you'd like.",
  "Summarize today's activity": "**Today's Activity Summary — Aug 1, 2025**\n\n✅ **1 Check-in**: M/Y Serenity (Slip A-03)\n✅ **1 Check-out**: S/V Wind Dancer (Slip B-07)\n✅ **Payment received**: $2,550 from Robert Chen\n✅ **New reservation**: Slip B-04 (Aug 5-12)\n📋 **Maintenance request**: Slip A-06 electrical\n\n**Occupancy: 74%** (14 of 19 slips occupied)\n\nAll clear! No alerts require immediate attention.",
};

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your **MarinaOS AI Co-Pilot**. I can help you with:\n\n• **Customer inquiries** — Who owes money, contact info\n• **Slip availability** — Open slips, upcoming reservations\n• **Revenue & analytics** — Financial summaries, trends\n• **Maintenance** — Work orders, inspections due\n• **Operations** — Daily summaries, alerts\n\nWhat would you like to know about your marina?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = sampleResponses[text] || sampleResponses[Object.keys(sampleResponses)[Math.floor(Math.random() * Object.keys(sampleResponses).length)]];
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response || "I've analyzed the data and found the information you requested. Let me know if you need more details or would like me to take any action on this.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-primary" />
              AI Co-Pilot
            </h1>
            <p className="text-muted-foreground mt-1">Natural language queries and automated operations</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="automation">
              <Zap className="h-4 w-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage Stats
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chat Area */}
              <div className="lg:col-span-3">
                <GlassCard className="p-0 flex flex-col h-[600px]" hover={false}>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                        {msg.role === "assistant" && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className={`max-w-[80%] ${msg.role === "user" ? "order-1" : ""}`}>
                          <div
                            className={`rounded-2xl p-3.5 text-sm ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-secondary/50 rounded-tl-none"
                            }`}
                          >
                            <div className="whitespace-pre-line leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: msg.content
                                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                  .replace(/\n/g, "<br/>")
                              }}
                            />
                          </div>
                          <p className={`text-[10px] text-muted-foreground mt-1 ${msg.role === "user" ? "text-right" : ""}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                        {msg.role === "user" && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-secondary/50 rounded-2xl rounded-tl-none p-3.5">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask anything about your marina..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                        className="flex-1"
                      />
                      <Button onClick={() => handleSend(input)} disabled={!input.trim() || isTyping}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Quick Questions Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-primary" />
                      Quick Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {quickQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSend(q)}
                          disabled={isTyping}
                          className="w-full text-left p-3 rounded-xl bg-secondary/30 hover:bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          <span className="flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 flex-shrink-0 text-primary" />
                            {q}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                        <p className="text-xs font-medium text-yellow-500">Occupancy Alert</p>
                        <p className="text-xs text-muted-foreground mt-1">Weekend occupancy projected at 92%. Consider adjusting rates.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <p className="text-xs font-medium text-blue-500">Revenue Opportunity</p>
                        <p className="text-xs text-muted-foreground mt-1">3 customers haven't renewed annual contracts. Follow up recommended.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                        <p className="text-xs font-medium text-green-500">AI Automation Rate</p>
                        <p className="text-xs text-muted-foreground mt-1">76% of inquiries handled without human intervention this week.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Receptionist</CardTitle>
                  <CardDescription>Auto-response templates for customer inquiries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { trigger: "Availability inquiry", template: "Thank you for your interest! We have slips available in sizes 30'-80'. Would you like to check specific dates?", enabled: true },
                      { trigger: "Pricing request", template: "Our rates start at $120/night for slips up to 30'. Monthly discounts available. Would you like a full rate sheet?", enabled: true },
                      { trigger: "Reservation change", template: "I can help modify your reservation. Please provide your reservation number and the changes you'd like to make.", enabled: true },
                      { trigger: "After-hours inquiry", template: "Our office is currently closed. We'll respond to your inquiry during business hours (8 AM - 6 PM). For urgent matters, please call (555) 123-4567.", enabled: true },
                    ].map((template, i) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{template.trigger}</span>
                          <Badge variant={template.enabled ? "success" : "outline"} className="text-[10px]">
                            {template.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{template.template}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automation Rules</CardTitle>
                  <CardDescription>Scheduled automated actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Payment Reminder", description: "Send reminder email 3 days before invoice due date", schedule: "Daily at 9 AM", active: true },
                      { name: "Renewal Notice", description: "Notify customers 30 days before reservation expires", schedule: "Daily at 10 AM", active: true },
                      { name: "Maintenance Alert", description: "Alert staff when maintenance request is urgent priority", schedule: "Real-time", active: true },
                      { name: "Weekly Report", description: "Generate and email weekly operations summary", schedule: "Every Monday 8 AM", active: false },
                    ].map((rule, i) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{rule.name}</span>
                          <Badge variant={rule.active ? "success" : "outline"} className="text-[10px]">
                            {rule.active ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {rule.schedule}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usage Stats Tab */}
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard label="AI Automation Rate" value="76%" change="+5.4%" changeType="positive" icon={<Activity className="h-4 w-4" />} />
              <StatsCard label="Inquiries Handled" value="1,247" change="+182" changeType="positive" icon={<MessageCircle className="h-4 w-4" />} />
              <StatsCard label="Avg Response Time" value="1.2s" icon={<Zap className="h-4 w-4" />} />
              <StatsCard label="Customer Satisfaction" value="94%" change="+2.1%" changeType="positive" icon={<ThumbsUp className="h-4 w-4" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inquiry Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { category: "Slip Availability", count: 412, pct: 33 },
                      { category: "Pricing & Billing", count: 298, pct: 24 },
                      { category: "Reservations", count: 245, pct: 20 },
                      { category: "Maintenance", count: 156, pct: 12 },
                      { category: "General Info", count: 136, pct: 11 },
                    ].map((item) => (
                      <div key={item.category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{item.category}</span>
                          <span className="text-muted-foreground">{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { day: "Mon", handled: 180, automated: 140 },
                      { day: "Tue", handled: 210, automated: 165 },
                      { day: "Wed", handled: 195, automated: 148 },
                      { day: "Thu", handled: 220, automated: 172 },
                      { day: "Fri", handled: 245, automated: 180 },
                      { day: "Sat", handled: 120, automated: 90 },
                      { day: "Sun", handled: 77, automated: 62 },
                    ].map((day) => {
                      const pct = Math.round((day.automated / day.handled) * 100);
                      return (
                        <div key={day.day} className="flex items-center gap-3">
                          <span className="text-xs font-medium w-8">{day.day}</span>
                          <div className="flex-1 h-5 rounded-lg bg-secondary overflow-hidden flex">
                            <div className="h-full bg-primary/60 rounded-l-lg" style={{ width: `${pct}%` }} title={`Automated: ${day.automated}`} />
                            <div className="h-full bg-secondary-foreground/10" style={{ width: `${100 - pct}%` }} title={`Manual: ${day.handled - day.automated}`} />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">{day.handled}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/60" /> Automated</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary-foreground/10" /> Manual</span>
                    </div>
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
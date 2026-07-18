"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { Ship, Building2, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marinaName, setMarinaName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marinaName: marinaName.trim(),
          email: email.trim(),
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          timezone: "America/New_York",
          docks: [],
          hasFuelDock: false,
          hasDryStorage: false,
          agreeTerms: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create marina");
      }
      setStep(3);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 bg-animate-gradient" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6 sm:p-8">

              {/* Welcome */}
              {step === 0 && (
                <div className="text-center space-y-6 py-4">
                  <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-xl">
                      <Ship className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold">Welcome to MarinaOS</h2>
                    <p className="text-muted-foreground mt-3">The AI-powered operating system for marinas.</p>
                  </div>
                  <Button onClick={() => setStep(1)} className="min-w-[140px]">
                    Get Started <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Marina Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-display font-bold">Tell us about your marina</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Docks &amp; slips will be auto-created</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Marina name *</label>
                    <Input value={marinaName} onChange={(e) => setMarinaName(e.target.value)} placeholder="e.g. Newport Marina" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email *</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@marina.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Address</label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Harbor Boulevard" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">City</label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Newport Beach" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">State</label>
                      <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="CA" />
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep(0)} disabled={loading}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => {
                      if (!marinaName.trim()) { setError("Marina name is required"); return; }
                      if (!email.trim()) { setError("Email is required"); return; }
                      setError(null);
                      setStep(2);
                    }} disabled={loading} className="flex-1">
                      Continue <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Review */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-display font-bold">Review your setup</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Everything look good?</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <h3 className="font-medium mb-2 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> {marinaName}</h3>
                    <p className="text-sm text-muted-foreground">{email}{phone ? ` · ${phone}` : ""}</p>
                    {city && <p className="text-sm text-muted-foreground">{city}{state ? `, ${state}` : ""}</p>}
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <div className="flex justify-between"><span className="text-sm font-medium">MarinaOS Plan</span><span className="text-sm font-bold">$1,500/month</span></div>
                    <p className="text-xs text-muted-foreground mt-1">14-day free trial</p>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1 rounded border-border" />
                    <span className="text-sm text-muted-foreground">I agree to the Terms of Service</span>
                  </label>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => {
                      if (!agreeTerms) { setError("Please agree to the terms"); return; }
                      handleSubmit();
                    }} disabled={loading} loading={loading} className="flex-1">
                      <Check className="h-4 w-4 mr-2" /> Create Marina
                    </Button>
                  </div>
                </div>
              )}

              {/* Complete */}
              {step === 3 && (
                <div className="text-center space-y-6 py-8">
                  <div className="flex justify-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
                        <Check className="h-12 w-12 text-green-500" />
                      </div>
                    </motion.div>
                  </div>
                  <h2 className="text-3xl font-display font-bold">You&apos;re all set!</h2>
                  <p className="text-muted-foreground">Redirecting to your dashboard...</p>
                </div>
              )}

            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

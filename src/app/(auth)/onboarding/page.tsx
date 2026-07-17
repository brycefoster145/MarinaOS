"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Ship,
  Anchor,
  MapPin,
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  Phone,
  Globe,
} from "lucide-react";

const steps = [
  { id: "welcome", title: "Welcome", icon: Sparkles },
  { id: "marina", title: "Marina Details", icon: Building2 },
  { id: "location", title: "Location", icon: MapPin },
  { id: "billing", title: "Billing", icon: CreditCard },
  { id: "complete", title: "Complete", icon: Check },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    marinaName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    totalSlips: "50",
    hasFuelDock: false,
    hasDryStorage: false,
    website: "",
    agreeTerms: false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step - create organization and redirect
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      router.push("/");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-animate-gradient" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Steps indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    i <= currentStep
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <s.icon className="h-5 w-5" />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-16 sm:w-24 h-0.5 mx-2 bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: i < currentStep ? "100%" : "0%",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-8 sm:p-10">
              {currentStep === 0 && (
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/20">
                      <Ship className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold tracking-tight">
                      Welcome to MarinaOS
                    </h2>
                    <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                      The world&apos;s first AI-powered operating system for marinas.
                      Let&apos;s get your marina set up in just a few steps.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                    {[
                      { icon: Anchor, label: "Smart Slip Management" },
                      { icon: Building2, label: "AI-Powered Insights" },
                      { icon: CreditCard, label: "Automated Billing" },
                    ].map((feature) => (
                      <div
                        key={feature.label}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50"
                      >
                        <feature.icon className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">{feature.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your 14-day free trial starts after setup. No credit card required.
                  </p>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-display font-bold">Tell us about your marina</h2>
                    <p className="text-muted-foreground mt-1">We&apos;ll customize the experience for you</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Marina Name</label>
                      <Input
                        placeholder="e.g. Harbor View Marina"
                        value={formData.marinaName}
                        onChange={(e) => updateField("marinaName", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Email</label>
                        <Input
                          type="email"
                          placeholder="info@marina.com"
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Phone</label>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Website (optional)</label>
                      <Input
                        placeholder="https://www.marina.com"
                        value={formData.website}
                        onChange={(e) => updateField("website", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Total Number of Slips</label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={formData.totalSlips}
                        onChange={(e) => updateField("totalSlips", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-display font-bold">Where are you located?</h2>
                    <p className="text-muted-foreground mt-1">This helps us set up local settings</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Address</label>
                      <Input
                        placeholder="123 Harbor Boulevard"
                        value={formData.address}
                        onChange={(e) => updateField("address", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">City</label>
                        <Input
                          placeholder="Newport Beach"
                          value={formData.city}
                          onChange={(e) => updateField("city", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">State</label>
                        <Input
                          placeholder="CA"
                          value={formData.state}
                          onChange={(e) => updateField("state", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">ZIP Code</label>
                        <Input
                          placeholder="92660"
                          value={formData.zipCode}
                          onChange={(e) => updateField("zipCode", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasFuelDock}
                          onChange={(e) => updateField("hasFuelDock", e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">Has Fuel Dock</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasDryStorage}
                          onChange={(e) => updateField("hasDryStorage", e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">Has Dry Storage</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-display font-bold">Almost there!</h2>
                    <p className="text-muted-foreground mt-1">
                      Start your 14-day free trial. No payment required.
                    </p>
                  </div>
                  <div className="bg-secondary/30 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">MarinaOS Plan</span>
                      <span className="text-sm font-bold">$1,500/month</span>
                    </div>
                    <div className="border-t border-border pt-4 space-y-2">
                      {[
                        "AI-Powered Management",
                        "Unlimited Slips & Docks",
                        "Customer Portal",
                        "Fuel Dock Management",
                        "Dry Storage",
                        "Maintenance Tracking",
                        "AI Co-Pilot",
                        "Advanced Analytics",
                        "24/7 Support",
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>Free Trial</span>
                        <span className="font-medium text-primary">14 Days</span>
                      </div>
                    </div>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => updateField("agreeTerms", e.target.checked)}
                      className="mt-1 rounded border-border"
                    />
                    <span className="text-sm text-muted-foreground">
                      I agree to the Terms of Service and Privacy Policy. I understand my
                      14-day free trial will start immediately.
                    </span>
                  </label>
                </div>
              )}

              {currentStep === 4 && (
                <div className="text-center space-y-6 py-8">
                  <div className="flex justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
                        <Check className="h-12 w-12 text-green-500" />
                      </div>
                    </motion.div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold">You&apos;re all set!</h2>
                    <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                      Your marina is ready. We&apos;re setting up your dashboard and
                      AI systems. Let&apos;s dive in!
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Setting up your marina...
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0 || loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  loading={loading && currentStep === steps.length - 1}
                  className="min-w-[140px]"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
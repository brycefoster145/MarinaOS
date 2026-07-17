"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  Plus,
  Trash2,
  Fuel,
  Warehouse,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

// === Types ===
interface DockConfig {
  id: string;
  name: string;
  color: string;
  slipCount: number;
  slipPrefix: string;
  slipLength: number;
  slipWidth: number;
  dailyRate: number;
  monthlyRate: number;
  annualRate: number;
}

interface FuelPriceConfig {
  price: number;
  cost: number;
  capacity: number;
}

interface StorageRackConfig {
  id: string;
  name: string;
  capacity: number;
  location: string;
}

interface OnboardingFormData {
  // Step 1 - Marina
  marinaName: string;
  email: string;
  phone: string;
  website: string;

  // Step 2 - Docks
  docks: DockConfig[];

  // Step 3 - Location & Features
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone: string;
  hasFuelDock: boolean;
  hasDryStorage: boolean;

  // Step 4a - Fuel (conditional)
  fuelGasolinePrice: number;
  fuelGasolineCost: number;
  fuelGasolineCapacity: number;
  fuelDieselPrice: number;
  fuelDieselCost: number;
  fuelDieselCapacity: number;
  fuelPremiumPrice: number;
  fuelPremiumCost: number;
  fuelPremiumCapacity: number;

  // Step 4b - Storage (conditional)
  storageRacks: StorageRackConfig[];

  // Step 5 - Terms
  agreeTerms: boolean;
}

const defaultDock = (id: string, prefix: string): DockConfig => ({
  id,
  name: `Dock ${prefix}`,
  color: "#0284c7",
  slipCount: 10,
  slipPrefix: prefix,
  slipLength: 40,
  slipWidth: 16,
  dailyRate: 3.5,
  monthlyRate: 85,
  annualRate: 850,
});

const defaultStorageRack = (id: string): StorageRackConfig => ({
  id,
  name: `Rack ${id}`,
  capacity: 10,
  location: "",
});

const DOCK_COLORS = ["#0284c7", "#059669", "#d97706", "#7c3aed", "#dc2626", "#0891b2", "#65a30d", "#0d9488"];

const steps = [
  { id: "welcome", title: "Welcome", icon: Sparkles },
  { id: "marina", title: "Marina Details", icon: Building2 },
  { id: "docks", title: "Docks & Slips", icon: Anchor },
  { id: "location", title: "Location & Features", icon: MapPin },
  { id: "config", title: "Configure", icon: Globe },
  { id: "review", title: "Review", icon: CreditCard },
  { id: "complete", title: "Complete", icon: Check },
];

let dockCounter = 0;
let rackCounter = 0;

function newDockId() {
  dockCounter += 1;
  const prefix = String.fromCharCode(64 + dockCounter);
  return { id: `dock-${dockCounter}`, prefix };
}

function newRackId() {
  rackCounter += 1;
  return `rack-${rackCounter}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<OnboardingFormData>(() => {
    const first = newDockId();
    return {
      marinaName: "",
      email: "",
      phone: "",
      website: "",
      docks: [defaultDock(first.id, first.prefix)],
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      timezone: "America/New_York",
      hasFuelDock: false,
      hasDryStorage: false,
      fuelGasolinePrice: 4.5,
      fuelGasolineCost: 3.2,
      fuelGasolineCapacity: 10000,
      fuelDieselPrice: 5.2,
      fuelDieselCost: 3.8,
      fuelDieselCapacity: 8000,
      fuelPremiumPrice: 5.8,
      fuelPremiumCost: 4.2,
      fuelPremiumCapacity: 5000,
      storageRacks: [defaultStorageRack(newRackId())],
      agreeTerms: false,
    };
  });

  const updateField = <K extends keyof OnboardingFormData>(
    field: K,
    value: OnboardingFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateDock = (id: string, field: keyof DockConfig, value: number | string) => {
    setForm((prev) => ({
      ...prev,
      docks: prev.docks.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    }));
  };

  const addDock = () => {
    const { id, prefix } = newDockId();
    setForm((prev) => ({
      ...prev,
      docks: [...prev.docks, defaultDock(id, prefix)],
    }));
  };

  const removeDock = (id: string) => {
    setForm((prev) => ({
      ...prev,
      docks: prev.docks.filter((d) => d.id !== id),
    }));
  };

  const updateRack = (id: string, field: keyof StorageRackConfig, value: number | string) => {
    setForm((prev) => ({
      ...prev,
      storageRacks: prev.storageRacks.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    }));
  };

  const addRack = () => {
    setForm((prev) => ({
      ...prev,
      storageRacks: [...prev.storageRacks, defaultStorageRack(newRackId())],
    }));
  };

  const removeRack = (id: string) => {
    setForm((prev) => ({
      ...prev,
      storageRacks: prev.storageRacks.filter((r) => r.id !== id),
    }));
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    switch (step) {
      case 1: // Marina info
        if (!form.marinaName.trim()) {
          setError("Please enter your marina name");
          return false;
        }
        if (!form.email.trim()) {
          setError("Please enter an email address");
          return false;
        }
        return true;
      case 2: // Docks
        if (form.docks.length === 0) {
          setError("At least one dock is required");
          return false;
        }
        for (const dock of form.docks) {
          if (!dock.name.trim()) {
            setError("All docks must have a name");
            return false;
          }
          if (dock.slipCount < 1) {
            setError(`Dock "${dock.name}" must have at least 1 slip`);
            return false;
          }
          if (dock.slipLength < 10) {
            setError(`Dock "${dock.name}" slip length must be at least 10 ft`);
            return false;
          }
        }
        return true;
      case 3: // Location
        if (!form.city.trim()) {
          setError("Please enter your city");
          return false;
        }
        return true;
      case 5: // Review / terms
        if (!form.agreeTerms) {
          setError("Please agree to the terms of service");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      // Skip fuel/storage config if not enabled
      if (currentStep === 3) {
        if (!form.hasFuelDock && !form.hasDryStorage) {
          setCurrentStep(5); // Skip to review
          return;
        }
      }
      if (currentStep === 4) {
        // Both fuel and storage are shown on this step
        // Only skip if both disabled (already handled above)
      }
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step - call the API
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setError(null);
      // Go back but skip config if not needed
      if (currentStep === 5 && !form.hasFuelDock && !form.hasDryStorage) {
        setCurrentStep(3);
        return;
      }
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    setError(null);

    try {
      // Build the API request
      const fuelPrices: Record<string, FuelPriceConfig> = {};
      if (form.hasFuelDock) {
        fuelPrices.gasoline = {
          price: form.fuelGasolinePrice,
          cost: form.fuelGasolineCost,
          capacity: form.fuelGasolineCapacity,
        };
        fuelPrices.diesel = {
          price: form.fuelDieselPrice,
          cost: form.fuelDieselCost,
          capacity: form.fuelDieselCapacity,
        };
        fuelPrices.premiumGasoline = {
          price: form.fuelPremiumPrice,
          cost: form.fuelPremiumCost,
          capacity: form.fuelPremiumCapacity,
        };
      }

      const payload = {
        marinaName: form.marinaName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        zipCode: form.zipCode.trim() || undefined,
        country: form.country,
        timezone: form.timezone,
        docks: form.docks.map((d) => ({
          name: d.name.trim(),
          color: d.color,
          slipCount: d.slipCount,
          slipPrefix: d.slipPrefix,
          slipLength: d.slipLength,
          slipWidth: d.slipWidth,
          dailyRate: d.dailyRate,
          monthlyRate: d.monthlyRate,
          annualRate: d.annualRate,
        })),
        hasFuelDock: form.hasFuelDock,
        fuelPrices: form.hasFuelDock ? fuelPrices : undefined,
        hasDryStorage: form.hasDryStorage,
        storageRacks: form.hasDryStorage
          ? form.storageRacks.map((r) => ({
              name: r.name.trim(),
              capacity: r.capacity,
              location: r.location.trim() || undefined,
            }))
          : undefined,
        agreeTerms: form.agreeTerms,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to create organization");
      }

      // Move to complete step
      setCurrentStep(6);

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirstOrLast = currentStep === 0 || currentStep === 6;
  const isConfigStep = currentStep === 4;

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-animate-gradient" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Steps indicator - hide on welcome/complete */}
        {!isFirstOrLast && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {steps.slice(1, -1).map((s, i) => {
                const stepIndex = i + 1;
                return (
                  <div key={s.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-300 ${
                        stepIndex <= currentStep
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {stepIndex < currentStep ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        stepIndex
                      )}
                    </div>
                    {i < steps.length - 3 && (
                      <div className="w-8 sm:w-16 h-0.5 mx-1.5 bg-secondary">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: stepIndex < currentStep ? "100%" : "0%",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Step {currentStep} of {steps.length - 2}
              </p>
            </div>
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
              {/* === STEP 0: Welcome === */}
              {currentStep === 0 && (
                <div className="text-center space-y-6 py-4">
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

              {/* === STEP 1: Marina Info === */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-display font-bold">Tell us about your marina</h2>
                    <p className="text-muted-foreground mt-1">We&apos;ll customize the experience for you</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Marina Name *</label>
                      <Input
                        placeholder="e.g. Harbor View Marina"
                        value={form.marinaName}
                        onChange={(e) => updateField("marinaName", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Email *</label>
                        <Input
                          type="email"
                          placeholder="info@marina.com"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Phone</label>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Website (optional)</label>
                      <Input
                        placeholder="https://www.marina.com"
                        value={form.website}
                        onChange={(e) => updateField("website", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* === STEP 2: Docks & Slips === */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-display font-bold">Configure your docks</h2>
                    <p className="text-muted-foreground mt-1">
                      Add docks and set up slip pricing
                    </p>
                  </div>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {form.docks.map((dock, idx) => (
                      <div
                        key={dock.id}
                        className="p-4 rounded-xl bg-secondary/30 border border-border relative"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: DOCK_COLORS[idx % DOCK_COLORS.length] }}
                            />
                            <span className="font-medium text-sm">Dock {idx + 1}</span>
                          </div>
                          {form.docks.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => removeDock(dock.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block">Name</label>
                            <Input
                              value={dock.name}
                              onChange={(e) => updateDock(dock.id, "name", e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Slip Prefix</label>
                            <Input
                              value={dock.slipPrefix}
                              onChange={(e) => updateDock(dock.id, "slipPrefix", e.target.value)}
                              className="h-9 text-sm"
                              placeholder="A"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block"># of Slips</label>
                            <Input
                              type="number"
                              min={1}
                              value={dock.slipCount}
                              onChange={(e) =>
                                updateDock(dock.id, "slipCount", parseInt(e.target.value) || 1)
                              }
                              className="h-9 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Length (ft)</label>
                            <Input
                              type="number"
                              min={10}
                              step={1}
                              value={dock.slipLength}
                              onChange={(e) =>
                                updateDock(dock.id, "slipLength", parseFloat(e.target.value) || 30)
                              }
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block">Width (ft)</label>
                            <Input
                              type="number"
                              min={8}
                              step={0.5}
                              value={dock.slipWidth}
                              onChange={(e) =>
                                updateDock(dock.id, "slipWidth", parseFloat(e.target.value) || 14)
                              }
                              className="h-9 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Daily Rate ($)</label>
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              value={dock.dailyRate}
                              onChange={(e) =>
                                updateDock(dock.id, "dailyRate", parseFloat(e.target.value) || 0)
                              }
                              className="h-9 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Monthly Rate ($)</label>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={dock.monthlyRate}
                              onChange={(e) =>
                                updateDock(dock.id, "monthlyRate", parseFloat(e.target.value) || 0)
                              }
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" onClick={addDock} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Dock
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Total slips: {form.docks.reduce((sum, d) => sum + d.slipCount, 0)}
                  </p>
                </div>
              )}

              {/* === STEP 3: Location & Features === */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-display font-bold">Where are you located?</h2>
                    <p className="text-muted-foreground mt-1">
                      This helps us set up local settings and features
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Address</label>
                      <Input
                        placeholder="123 Harbor Boulevard"
                        value={form.address}
                        onChange={(e) => updateField("address", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">City *</label>
                        <Input
                          placeholder="Newport Beach"
                          value={form.city}
                          onChange={(e) => updateField("city", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">State</label>
                        <Input
                          placeholder="CA"
                          value={form.state}
                          onChange={(e) => updateField("state", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">ZIP Code</label>
                        <Input
                          placeholder="92660"
                          value={form.zipCode}
                          onChange={(e) => updateField("zipCode", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Timezone</label>
                      <Select
                        value={form.timezone}
                        onValueChange={(v) => updateField("timezone", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                          <SelectItem value="America/Anchorage">Alaska (AKT)</SelectItem>
                          <SelectItem value="Pacific/Honolulu">Hawaii (HT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="Australia/Sydney">Sydney (AET)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border-t border-border pt-5 mt-5">
                      <h3 className="font-medium mb-3">Additional Services</h3>
                      <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={form.hasFuelDock}
                            onChange={(e) => updateField("hasFuelDock", e.target.checked)}
                            className="rounded border-border"
                          />
                          <Fuel className="h-5 w-5 text-primary" />
                          <div>
                            <span className="text-sm font-medium">Fuel Dock</span>
                            <p className="text-xs text-muted-foreground">
                              Sell gasoline, diesel, and premium fuel
                            </p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={form.hasDryStorage}
                            onChange={(e) => updateField("hasDryStorage", e.target.checked)}
                            className="rounded border-border"
                          />
                          <Warehouse className="h-5 w-5 text-primary" />
                          <div>
                            <span className="text-sm font-medium">Dry Storage</span>
                            <p className="text-xs text-muted-foreground">
                              Manage rack storage for boats
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === STEP 4: Fuel & Storage Config === */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-display font-bold">Configure services</h2>
                    <p className="text-muted-foreground mt-1">
                      Set up pricing and inventory for your services
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Fuel Dock Configuration */}
                    {form.hasFuelDock && (
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                        <div className="flex items-center gap-2 mb-4">
                          <Fuel className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">Fuel Dock Pricing</h3>
                        </div>
                        <div className="space-y-4">
                          {/* Gasoline */}
                          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-background/50">
                            <div className="col-span-3">
                              <span className="text-sm font-medium">Gasoline</span>
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Sell Price ($/gal)</label>
                              <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={form.fuelGasolinePrice}
                                onChange={(e) =>
                                  updateField("fuelGasolinePrice", parseFloat(e.target.value) || 0)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Cost ($/gal)</label>
                              <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={form.fuelGasolineCost}
                                onChange={(e) =>
                                  updateField("fuelGasolineCost", parseFloat(e.target.value) || 0)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Tank Capacity (gal)</label>
                              <Input
                                type="number"
                                min={100}
                                step={100}
                                value={form.fuelGasolineCapacity}
                                onChange={(e) =>
                                  updateField("fuelGasolineCapacity", parseInt(e.target.value) || 1000)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>

                          {/* Diesel */}
                          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-background/50">
                            <div className="col-span-3">
                              <span className="text-sm font-medium">Diesel</span>
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Sell Price ($/gal)</label>
                              <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={form.fuelDieselPrice}
                                onChange={(e) =>
                                  updateField("fuelDieselPrice", parseFloat(e.target.value) || 0)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Cost ($/gal)</label>
                              <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={form.fuelDieselCost}
                                onChange={(e) =>
                                  updateField("fuelDieselCost", parseFloat(e.target.value) || 0)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Tank Capacity (gal)</label>
                              <Input
                                type="number"
                                min={100}
                                step={100}
                                value={form.fuelDieselCapacity}
                                onChange={(e) =>
                                  updateField("fuelDieselCapacity", parseInt(e.target.value) || 1000)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>

                          {/* Premium Gasoline */}
                          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-background/50">
                            <div className="col-span-3">
                              <span className="text-sm font-medium">Premium Gasoline</span>
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Sell Price ($/gal)</label>
                              <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={form.fuelPremiumPrice}
                                onChange={(e) =>
                                  updateField("fuelPremiumPrice", parseFloat(e.target.value) || 0)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Cost ($/gal)</label>
                              <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={form.fuelPremiumCost}
                                onChange={(e) =>
                                  updateField("fuelPremiumCost", parseFloat(e.target.value) || 0)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Tank Capacity (gal)</label>
                              <Input
                                type="number"
                                min={100}
                                step={100}
                                value={form.fuelPremiumCapacity}
                                onChange={(e) =>
                                  updateField("fuelPremiumCapacity", parseInt(e.target.value) || 1000)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dry Storage Configuration */}
                    {form.hasDryStorage && (
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">Dry Storage Racks</h3>
                          </div>
                          <Button variant="outline" size="sm" onClick={addRack}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add Rack
                          </Button>
                        </div>

                        <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                          {form.storageRacks.map((rack) => (
                            <div
                              key={rack.id}
                              className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-background/50 relative"
                            >
                              <div>
                                <label className="text-xs font-medium mb-1 block">Rack Name</label>
                                <Input
                                  value={rack.name}
                                  onChange={(e) => updateRack(rack.id, "name", e.target.value)}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium mb-1 block">Capacity</label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={rack.capacity}
                                  onChange={(e) =>
                                    updateRack(rack.id, "capacity", parseInt(e.target.value) || 1)
                                  }
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="flex items-end gap-1">
                                <div className="flex-1">
                                  <label className="text-xs font-medium mb-1 block">Location</label>
                                  <Input
                                    value={rack.location}
                                    onChange={(e) => updateRack(rack.id, "location", e.target.value)}
                                    className="h-9 text-sm"
                                    placeholder="e.g. Building A"
                                  />
                                </div>
                                {form.storageRacks.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 text-destructive flex-shrink-0"
                                    onClick={() => removeRack(rack.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === STEP 5: Review & Terms === */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-display font-bold">Review your setup</h2>
                    <p className="text-muted-foreground mt-1">
                      Everything look good? Let&apos;s get started.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Marina Summary */}
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {form.marinaName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{form.email}</p>
                      {form.phone && (
                        <p className="text-sm text-muted-foreground">{form.phone}</p>
                      )}
                      {form.city && (
                        <p className="text-sm text-muted-foreground">
                          {form.city}{form.state ? `, ${form.state}` : ""}
                        </p>
                      )}
                    </div>

                    {/* Docks Summary */}
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Anchor className="h-4 w-4 text-primary" />
                        Docks & Slips
                      </h3>
                      <div className="space-y-1">
                        {form.docks.map((dock, idx) => (
                          <div key={dock.id} className="flex items-center justify-between text-sm">
                            <span>
                              {dock.name} ({dock.slipPrefix})
                            </span>
                            <span className="text-muted-foreground">
                              {dock.slipCount} slips · {dock.slipLength}ft · $
                              {dock.monthlyRate}/mo
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm font-medium">
                          <span>Total</span>
                          <span>
                            {form.docks.reduce((s, d) => s + d.slipCount, 0)} slips
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Services Summary */}
                    {(form.hasFuelDock || form.hasDryStorage) && (
                      <div className="p-4 rounded-xl bg-secondary/30">
                        <h3 className="font-medium text-sm mb-2">Services</h3>
                        {form.hasFuelDock && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Fuel className="h-3.5 w-3.5 text-primary" />
                            Fuel Dock — Gas ${form.fuelGasolinePrice}/gal · Diesel $
                            {form.fuelDieselPrice}/gal · Premium ${form.fuelPremiumPrice}/gal
                          </p>
                        )}
                        {form.hasDryStorage && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Warehouse className="h-3.5 w-3.5 text-primary" />
                            Dry Storage — {form.storageRacks.length} racks,{" "}
                            {form.storageRacks.reduce((s, r) => s + r.capacity, 0)} total capacity
                          </p>
                        )}
                      </div>
                    )}

                    {/* Plan Summary */}
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">MarinaOS Plan</span>
                        <span className="text-sm font-bold">$1,500/month</span>
                      </div>
                      <div className="border-t border-border mt-3 pt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Free Trial</span>
                          <span className="font-medium text-primary">14 Days</span>
                        </div>
                      </div>
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-3 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={form.agreeTerms}
                        onChange={(e) => updateField("agreeTerms", e.target.checked)}
                        className="mt-1 rounded border-border"
                      />
                      <span className="text-sm text-muted-foreground">
                        I agree to the Terms of Service and Privacy Policy. I understand my
                        14-day free trial will start immediately.
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                </div>
              )}

              {/* === STEP 6: Complete === */}
              {currentStep === 6 && (
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
                      Your marina is being set up with AI-powered systems.
                      Redirecting to your dashboard...
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Finalizing your setup...
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons - hide on complete step */}
              {currentStep < 6 && (
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 0 || loading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  {currentStep === 0 ? (
                    <Button onClick={handleNext} className="min-w-[140px]">
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={loading}
                      loading={loading}
                      className="min-w-[140px]"
                    >
                      {currentStep === steps.length - 2 ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Create Marina
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

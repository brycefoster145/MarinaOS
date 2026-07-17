"use client";

import { useState, useEffect } from "react";
import { X, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  daysRemaining: number;
  plan: string;
}

export function TrialBanner({ daysRemaining, plan }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (plan === "ACTIVE") return null;
  if (daysRemaining <= 0) {
    // Trial expired
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-destructive" />
            <span className="text-destructive font-medium">Trial expired</span>
            <span className="text-muted-foreground">Your free trial has ended. Please update billing to continue.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="destructive">
              Update Billing
            </Button>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (daysRemaining <= 7) {
    // Warning - trial ending soon
    return (
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-yellow-500 font-medium">{daysRemaining} days remaining</span>
            <span className="text-muted-foreground">in your free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-yellow-500 border-yellow-500/20">
              Upgrade Now
            </Button>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 border-b border-primary/10 px-4 py-2">
      <div className="flex items-center gap-2 text-sm justify-center">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-primary font-medium">{daysRemaining} days</span>
        <span className="text-muted-foreground">remaining in your free trial</span>
      </div>
    </div>
  );
}

export function useTrialStatus() {
  // Placeholder - will be replaced with real subscription check
  const [status, setStatus] = useState<{ daysRemaining: number; plan: string }>({
    daysRemaining: 14,
    plan: "TRIAL",
  });

  return status;
}
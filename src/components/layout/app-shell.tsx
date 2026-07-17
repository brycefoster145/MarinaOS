"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AuthGuard } from "@/components/auth/auth-guard";
import { TrialBanner, useTrialStatus } from "@/components/billing/trial-banner";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const trial = useTrialStatus();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Trial Banner */}
        <TrialBanner daysRemaining={trial.daysRemaining} plan={trial.plan} />

        {/* Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 h-full w-64 animate-slide-in-right">
              <Sidebar onToggle={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div
          className={cn(
            "transition-all duration-300",
            sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
          )}
        >
          <TopBar onMenuToggle={() => setMobileMenuOpen(true)} />
          <main className="animate-fade-in">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
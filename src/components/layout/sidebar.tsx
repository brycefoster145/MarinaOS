"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Anchor,
  Users,
  FileText,
  Container,
  Droplets,
  Warehouse,
  Wrench,
  BarChart3,
  Settings,
  LifeBuoy,
  Menu,
  X,
  ChevronLeft,
  Ship,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Slips & Docks", href: "/slips", icon: Anchor },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Billing", href: "/billing", icon: FileText },
  { name: "Fuel Dock", href: "/fuel-dock", icon: Droplets },
  { name: "Dry Storage", href: "/dry-storage", icon: Warehouse },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Employees", href: "/employees", icon: Container },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI Co-Pilot", href: "/ai-copilot", icon: Sparkles },
];

const secondaryNav = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Support", href: "/support", icon: LifeBuoy },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-all duration-300",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b border-border px-4", isCollapsed && "justify-center")}>
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <Ship className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-base font-display font-bold tracking-tight">MarinaOS</span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">AI-Powered Marina Management</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Main */}
        <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
          {!isCollapsed && (
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Main Menu
            </p>
          )}
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "nav-link group",
                  isCollapsed && "justify-center px-2",
                  isActive ? "nav-link-active" : "nav-link-inactive"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                {!isCollapsed && <span>{item.name}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 hidden rounded-lg bg-popover px-2.5 py-1.5 text-xs font-medium shadow-md group-hover:block whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary */}
        <div className={cn("pt-4 space-y-1", isCollapsed && "flex flex-col items-center")}>
          {!isCollapsed && (
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              System
            </p>
          )}
          {secondaryNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "nav-link group",
                  isCollapsed && "justify-center px-2",
                  isActive ? "nav-link-active" : "nav-link-inactive"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
        </button>
      </div>
    </aside>
  );
}

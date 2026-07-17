"use client";

import { cn } from "@/lib/utils";
import { Bell, Search, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui";
import { Avatar } from "@/components/ui/avatar";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(theme !== "light");
  const [isClerkReady, setIsClerkReady] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    setIsClerkReady(
      !!key && key !== "pk_test_placeholder" && key.length > 20
    );
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    setIsDark(!isDark);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-secondary lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md ml-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search slips, customers, invoices..."
            className="pl-10 h-9 rounded-xl bg-secondary/50 border-0 focus-visible:bg-background"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button className="relative rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>

        {/* User avatar / Clerk UserButton */}
        <div className="ml-2 pl-2 border-l border-border flex items-center gap-3">
          {isClerkReady ? (
            <DynamicUserButton />
          ) : (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">Captain Alex</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <Avatar firstName="Alex" lastName="Marina" size="md" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function DynamicUserButton() {
  const [UserButtonComponent, setUserButtonComponent] = useState<any>(null);

  useEffect(() => {
    import("@clerk/nextjs").then((mod) => {
      setUserButtonComponent(() => mod.UserButton);
    });
  }, []);

  if (!UserButtonComponent) {
    return <div className="h-9 w-9 rounded-xl bg-secondary animate-pulse" />;
  }

  return (
    <UserButtonComponent
      afterSignOutUrl="/sign-in"
      appearance={{
        elements: {
          avatarBox: "h-9 w-9 rounded-xl ring-2 ring-border hover:ring-primary transition-all",
          userButtonPopoverCard: "glass-panel border-border",
          userButtonPopoverActions: "text-foreground",
          userButtonPopoverActionButton: "hover:bg-secondary rounded-lg",
          userPreviewMainIdentifier: "font-medium",
          userPreviewSecondaryIdentifier: "text-muted-foreground",
        },
      }}
    />
  );
}
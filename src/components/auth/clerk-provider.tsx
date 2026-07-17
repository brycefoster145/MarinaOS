"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [clerkTheme, setClerkTheme] = useState<any>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Dynamic import to avoid build errors when @clerk/themes is not installed
    import("@clerk/themes").then((mod) => {
      setClerkTheme(theme === "dark" ? mod.dark : undefined);
    }).catch(() => {
      // Themes not available, use default
    });
  }, [theme]);

  // Check if Clerk keys are configured
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isConfigured = publishableKey && 
    publishableKey !== "pk_test_placeholder" && 
    publishableKey.length > 20;

  if (!isConfigured) {
    // Clerk not configured - render children directly (no auth)
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: clerkTheme,
        variables: {
          colorPrimary: "hsl(199, 89%, 48%)",
          colorText: "hsl(var(--foreground))",
          colorBackground: "hsl(var(--background))",
          colorInputBackground: "hsl(var(--background))",
          colorInputText: "hsl(var(--foreground))",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-sans)",
        },
        elements: {
          card: "shadow-xl border border-border bg-background",
          headerTitle: "text-2xl font-display font-bold",
          headerSubtitle: "text-muted-foreground",
          formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 px-5",
          formFieldInput: "rounded-xl border-border bg-background h-10",
          footerActionLink: "text-primary hover:text-primary/80",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          socialButtonsBlockButton: "rounded-xl border-border hover:bg-secondary",
          socialButtonsBlockButtonText: "text-foreground",
          formFieldLabel: "text-foreground",
          otpCodeFieldInput: "rounded-xl border-border",
          alert: "rounded-xl",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
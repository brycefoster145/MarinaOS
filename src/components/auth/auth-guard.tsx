"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

const publicRoutes = ["/sign-in", "/sign-up", "/onboarding"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId, orgId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Check if Clerk is configured
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = publishableKey && 
    publishableKey !== "pk_test_placeholder" && 
    publishableKey.length > 20;

  // If Clerk is not configured, skip auth checks
  if (!isClerkConfigured) {
    return <>{children}</>;
  }

  useEffect(() => {
    if (!isLoaded) return;

    // Allow access to public routes
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return;
    }

    // Redirect to sign-in if not authenticated
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    // Redirect to onboarding if no organization
    if (!orgId && !pathname.startsWith("/onboarding")) {
      router.push("/onboarding");
      return;
    }
  }, [isLoaded, userId, orgId, pathname, router]);

  if (!isLoaded && isClerkConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <svg className="h-7 w-7 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 21V3" />
              <path d="M22 21V7" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading MarinaOS...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
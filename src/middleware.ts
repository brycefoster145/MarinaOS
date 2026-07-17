import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/sign-in", "/sign-up", "/api/webhooks/stripe", "/api/health"];

// Routes that require an active subscription
const subscriptionRoutes = ["/", "/slips", "/customers", "/billing", "/fuel-dock", "/dry-storage", "/maintenance", "/employees", "/analytics", "/ai-copilot", "/settings", "/support"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // API routes are handled separately
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // For protected routes, Clerk handles the redirect automatically
  // The subscription check happens on the client side
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/sign-in",
    "/sign-up",
    "/onboarding",
    "/api/webhooks/stripe",
    "/api/health",
    "/api/onboarding",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)"],
};
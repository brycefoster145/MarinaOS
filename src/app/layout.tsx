import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "MarinaOS - AI-Powered Marina Management",
    template: "%s | MarinaOS",
  },
  description:
    "The world's first AI-powered operating system for marinas, yacht clubs, and luxury waterfront properties.",
  keywords: [
    "marina management",
    "yacht club software",
    "slip management",
    "marina OS",
    "marina software",
    "boat slip reservation",
    "marina billing",
  ],
  authors: [{ name: "MarinaOS" }],
  openGraph: {
    title: "MarinaOS - AI-Powered Marina Management",
    description:
      "The world's first AI-powered operating system for marinas, yacht clubs, and luxury waterfront properties.",
    type: "website",
    siteName: "MarinaOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "MarinaOS - AI-Powered Marina Management",
    description:
      "The world's first AI-powered operating system for marinas, yacht clubs, and luxury waterfront properties.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "hsl(199, 89%, 48%)",
    colorText: "hsl(0, 0%, 95%)",
    colorBackground: "hsl(222, 47%, 6%)",
    colorInputBackground: "hsl(217, 33%, 9%)",
    colorInputText: "hsl(0, 0%, 95%)",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = publishableKey &&
    publishableKey !== "pk_test_placeholder" &&
    publishableKey.length > 20;

  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "glass-card",
        }}
      />
    </ThemeProvider>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans`}>
        {isClerkConfigured ? (
          <ClerkProvider
            publishableKey={publishableKey!}
            appearance={clerkAppearance}
          >
            {content}
          </ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}

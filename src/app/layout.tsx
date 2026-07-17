import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkThemeProvider } from "@/components/auth/clerk-provider";
import { Toaster } from "sonner";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkThemeProvider>
            {children}
          </ClerkThemeProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              className: "glass-card",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
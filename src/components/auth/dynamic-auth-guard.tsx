"use client";
import dynamic from "next/dynamic";

const AuthGuardClient = dynamic(
  () => import("@/components/auth/auth-guard").then((mod) => mod.AuthGuard),
  { ssr: false }
);

export function DynamicAuthGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuardClient>{children}</AuthGuardClient>;
}
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "avatar" | "table";
}

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
  const baseClass = "shimmer rounded-lg";
  
  const variants = {
    text: "h-4 w-full",
    card: "h-48 w-full rounded-2xl",
    avatar: "h-10 w-10 rounded-full",
    table: "h-8 w-full",
  };

  return <div className={cn(baseClass, variants[variant], className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton variant="card" className="h-80" />
        <Skeleton variant="card" className="h-80" />
      </div>
    </div>
  );
}
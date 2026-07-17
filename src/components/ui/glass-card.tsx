import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  blur?: "sm" | "md" | "lg";
}

export function GlassCard({ children, className, hover = true, blur = "md", ...props }: GlassCardProps) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-glass-border bg-glass-bg shadow-glass-shadow p-6 transition-all duration-300",
        blurClasses[blur],
        hover && "hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({ label, value, change, changeType = "neutral", icon, className }: StatsCardProps) {
  const changeColors = {
    positive: "text-green-500",
    negative: "text-red-500",
    neutral: "text-muted-foreground",
  };

  return (
    <GlassCard className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-display font-bold tracking-tight">{value}</span>
        {change && (
          <span className={cn("text-xs font-medium", changeColors[changeType])}>
            {change}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
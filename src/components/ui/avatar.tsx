import * as React from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  firstName?: string | null;
  lastName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, firstName, lastName, size = "md", ...props }, ref) => {
    const initials = getInitials(firstName, lastName);

    if (src) {
      return (
        <div
          ref={ref}
          className={cn("relative rounded-full overflow-hidden flex-shrink-0", sizeClasses[size], className)}
          {...props}
        >
          <img src={src} alt={alt || `${firstName} ${lastName}`} className="h-full w-full object-cover" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-full flex items-center justify-center bg-primary/10 text-primary font-medium flex-shrink-0",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {initials}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
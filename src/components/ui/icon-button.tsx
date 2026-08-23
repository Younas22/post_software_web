import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  /** Required — an icon-only button must always be labeled for assistive tech. */
  "aria-label": string;
}

const SIZE = { sm: "size-8", md: "size-9", lg: "size-10" };
const VARIANT = {
  default: "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  danger: "text-error hover:bg-error-soft",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "default", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
          SIZE[size],
          VARIANT[variant],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

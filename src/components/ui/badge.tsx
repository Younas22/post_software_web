import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        brand: "bg-brand-soft text-brand",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        error: "bg-error-soft text-error",
        info: "bg-info-soft text-info",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Maps the platform's common status strings to a sensible Badge variant + label. */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    active: { variant: "success", label: "Active" },
    inactive: { variant: "neutral", label: "Inactive" },
    completed: { variant: "success", label: "Completed" },
    pending: { variant: "warning", label: "Pending" },
    received: { variant: "success", label: "Received" },
    cancelled: { variant: "error", label: "Cancelled" },
    void: { variant: "error", label: "Void" },
    open: { variant: "info", label: "Open" },
    closed: { variant: "neutral", label: "Closed" },
    trial: { variant: "warning", label: "Trial" },
    expired: { variant: "error", label: "Expired" },
    suspended: { variant: "error", label: "Suspended" },
  };
  const entry = map[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

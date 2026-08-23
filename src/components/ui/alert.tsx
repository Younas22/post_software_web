import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva("flex gap-3 rounded-lg border p-4 text-sm [&_svg]:size-5 [&_svg]:shrink-0", {
  variants: {
    variant: {
      default: "border-border bg-muted text-foreground [&_svg]:text-muted-foreground",
      success: "border-success/20 bg-success-soft text-foreground [&_svg]:text-success",
      warning: "border-warning/20 bg-warning-soft text-foreground [&_svg]:text-warning",
      error: "border-error/20 bg-error-soft text-foreground [&_svg]:text-error",
      info: "border-info/20 bg-info-soft text-foreground [&_svg]:text-info",
    },
  },
  defaultVariants: { variant: "default" },
});

const ICON = { default: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle, info: Info };

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
}

export function Alert({ className, variant = "default", title, children, ...props }: AlertProps) {
  const Icon = ICON[variant ?? "default"];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold leading-tight">{title}</p>}
        {children && <div className={cn("text-muted-foreground", title && "mt-1")}>{children}</div>}
      </div>
    </div>
  );
}

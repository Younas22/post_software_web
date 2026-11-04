import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  isLoading,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "brand" | "success" | "warning" | "error";
  isLoading?: boolean;
  hint?: string;
}) {
  const toneClass = {
    default: "bg-muted text-muted-foreground",
    brand: "bg-brand-soft text-brand",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    error: "bg-error-soft text-error",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{value}</p>
          )}
          {hint && !isLoading && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="size-5" aria-hidden />
        </div>
      </div>
    </Card>
  );
}

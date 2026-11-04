import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * KPI tile. The value is never truncated: the icon sits on the label row so
 * the number gets the card's full width, its font size follows the card's
 * own width (container queries — the same card can sit in a 2-, 4- or
 * 6-column grid), and as a last resort a very long amount wraps instead of
 * being cut to "PKR …".
 */
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
    <Card className="@container flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium leading-snug text-muted-foreground">{label}</p>
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="size-[18px]" aria-hidden />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-28" />
      ) : (
        <p
          className="mt-1.5 text-lg font-bold leading-tight tracking-tight text-foreground tabular-nums [overflow-wrap:anywhere] @[12rem]:text-xl @[15rem]:text-2xl"
          title={value}
        >
          {value}
        </p>
      )}
      {hint && !isLoading && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

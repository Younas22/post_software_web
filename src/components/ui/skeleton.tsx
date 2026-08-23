import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

/** Skeleton rows matching DataTable's layout, shown while a list query is loading. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-1/4" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 rounded-xl border border-border p-5", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

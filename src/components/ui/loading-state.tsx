import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}
    >
      <Loader2 className="size-6 animate-spin text-brand" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function InlineSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

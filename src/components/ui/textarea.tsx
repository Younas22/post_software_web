import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-20 w-full rounded-lg border bg-[var(--input-background)] px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-error focus-visible:ring-error" : "border-input",
          className
        )}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

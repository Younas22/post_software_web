import type { ReactNode } from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

/** Consistent label + control + error/hint wrapper used across every form. */
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

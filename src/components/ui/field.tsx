import { cloneElement, isValidElement, useId, type ReactNode } from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

/**
 * Consistent label + control + error/hint wrapper used across every form.
 * Auto-generates and wires an id/htmlFor pair between the Label and its
 * single child control (Input/Textarea/a Radix Trigger, ...) via useId(),
 * so every field is screen-reader/getByLabel-addressable without each call
 * site remembering to pass matching id/htmlFor props by hand. An explicit
 * `htmlFor` (and a matching `id` on the child) still wins if provided.
 */
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
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;

  const control =
    isValidElement<{ id?: string }>(children) && !children.props.id
      ? cloneElement(children, { id: fieldId })
      : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      {control}
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

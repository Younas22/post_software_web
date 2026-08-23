"use client";

import { forwardRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-md bg-[#171717] px-2.5 py-1.5 text-xs font-medium text-white shadow-md dark:bg-[#f5f5f5] dark:text-[#171717]",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

/** Convenience one-liner for the common case: wrap a trigger, show text. */
export function SimpleTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

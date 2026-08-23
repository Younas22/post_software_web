"use client";

import { forwardRef } from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;
export const DropdownGroup = DropdownPrimitive.Group;
export const DropdownSub = DropdownPrimitive.Sub;
export const DropdownSubTrigger = DropdownPrimitive.SubTrigger;
export const DropdownRadioGroup = DropdownPrimitive.RadioGroup;

export const DropdownContent = forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
));
DropdownContent.displayName = "DropdownContent";

export const DropdownItem = forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { destructive?: boolean }
>(({ className, destructive, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
      "focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      destructive ? "text-error focus:bg-error-soft" : "text-foreground",
      className
    )}
    {...props}
  />
));
DropdownItem.displayName = "DropdownItem";

export const DropdownCheckboxItem = forwardRef<
  React.ElementRef<typeof DropdownPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <DropdownPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-muted",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Check className="size-4 text-brand" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownPrimitive.CheckboxItem>
));
DropdownCheckboxItem.displayName = "DropdownCheckboxItem";

export const DropdownLabel = forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
    {...props}
  />
));
DropdownLabel.displayName = "DropdownLabel";

export const DropdownSeparator = forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
DropdownSeparator.displayName = "DropdownSeparator";

export const DropdownSubTriggerIcon = ChevronRight;

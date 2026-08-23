"use client";

import { forwardRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "left" | "right";
  size?: "sm" | "md" | "lg";
}

const SIZE = { sm: "max-w-xs", md: "max-w-sm", lg: "max-w-md" };

export const DrawerContent = forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DrawerContentProps>(
  ({ className, side = "right", size = "md", children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-black/50"
        style={{ animation: "overlay-in var(--transition-base) ease-out" }}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-y-0 z-50 flex w-[calc(100vw-2.5rem)] flex-col border-border bg-card text-card-foreground shadow-lg focus:outline-none",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          SIZE[size],
          className
        )}
        style={{ animation: `${side === "right" ? "drawer-in-right" : "drawer-in-left"} var(--transition-base) ease-out` }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
);
DrawerContent.displayName = "DrawerContent";

export function DrawerHeader({
  children,
  className,
  onClose,
}: {
  children: ReactNode;
  className?: string;
  onClose?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2 border-b border-border p-4", className)}>
      <div className="min-w-0 flex-1">{children}</div>
      {onClose !== false && (
        <DialogPrimitive.Close
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

export const DrawerTitle = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-base font-semibold", className)} {...props} />
));
DrawerTitle.displayName = "DrawerTitle";

export function DrawerBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex-1 overflow-y-auto p-4", className)}>{children}</div>;
}

export function DrawerFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-2 border-t border-border p-4", className)}>{children}</div>;
}

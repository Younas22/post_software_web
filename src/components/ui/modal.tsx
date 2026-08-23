"use client";

import { forwardRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

const SIZE = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-4xl",
};

export interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: keyof typeof SIZE;
  hideClose?: boolean;
}

export const ModalContent = forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, ModalContentProps>(
  ({ className, size = "md", hideClose, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-black/50"
        style={{ animation: "overlay-in var(--transition-base) ease-out" }}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg",
          "max-h-[85vh] overflow-y-auto focus:outline-none",
          SIZE[size],
          className
        )}
        style={{ animation: "content-in var(--transition-base) ease-out" }}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
);
ModalContent.displayName = "ModalContent";

export function ModalHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-col gap-1 pr-6", className)}>{children}</div>;
}

export const ModalTitle = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
ModalDescription.displayName = "ModalDescription";

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>{children}</div>;
}

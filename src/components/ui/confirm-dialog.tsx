"use client";

import { useState, type ReactNode } from "react";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "./modal";
import { Button } from "./button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

/** Controlled confirm dialog — for destructive/important actions (delete, cancel, void, etc). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Imperative-feeling wrapper: const { confirm, dialog } = useConfirm(); await confirm({...}) */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    options: Omit<ConfirmDialogProps, "open" | "onOpenChange" | "onConfirm"> | null;
    resolve: ((value: boolean) => void) | null;
  }>({ open: false, options: null, resolve: null });

  const confirm = (options: Omit<ConfirmDialogProps, "open" | "onOpenChange" | "onConfirm">) =>
    new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolve });
    });

  const dialog = state.options ? (
    <ConfirmDialog
      {...state.options}
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          state.resolve?.(false);
          setState((s) => ({ ...s, open: false }));
        }
      }}
      onConfirm={() => {
        state.resolve?.(true);
        setState((s) => ({ ...s, open: false }));
      }}
    />
  ) : null;

  return { confirm, dialog };
}

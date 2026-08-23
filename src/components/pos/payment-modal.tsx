"use client";

import { useEffect, useState } from "react";
import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { formatCurrency, cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

const ICONS: Record<string, typeof Banknote> = { cash: Banknote, card: CreditCard, bank: Landmark, other: Wallet };

export function PaymentModal({
  open,
  onOpenChange,
  total,
  currency,
  isSubmitting,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  currency: string;
  isSubmitting?: boolean;
  error?: string | null;
  onConfirm: (payment: { method: PaymentMethod; received?: number; reference?: string }) => void;
}) {
  const methods = usePaymentMethods();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [received, setReceived] = useState("");
  const [reference, setReference] = useState("");

  // Resets the form's fields each time the modal opens for a fresh checkout
  // attempt (received defaults to exact change, no reference).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setReceived(String(total.toFixed(2)));
      setReference("");
      if (!method && methods.data?.length) setMethod(methods.data.find((m) => m.slug === "cash") ?? methods.data[0]);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, total, methods.data]);

  const isCash = method?.slug === "cash";
  const receivedNum = Number(received) || 0;
  const change = isCash ? Math.max(0, receivedNum - total) : 0;
  const canConfirm = !!method && (!isCash || receivedNum >= total);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Payment</ModalTitle>
        </ModalHeader>

        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Due</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(total, currency)}</p>
          </div>

          <Field label="Payment method" required>
            <div className="grid grid-cols-2 gap-2">
              {(methods.data ?? []).map((m) => {
                const Icon = ICONS[m.slug] ?? Wallet;
                const active = method?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "border-brand bg-brand-soft text-brand" : "border-border text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="size-4" /> {m.name}
                  </button>
                );
              })}
            </div>
          </Field>

          {isCash ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Received" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                />
              </Field>
              <Field label="Change">
                <div className="flex h-10 items-center rounded-lg border border-border bg-muted px-3 text-sm font-semibold text-foreground">
                  {formatCurrency(change, currency)}
                </div>
              </Field>
            </div>
          ) : (
            method && (
              <Field label="Reference" hint="Optional — transaction/check number">
                <Input value={reference} onChange={(e) => setReference(e.target.value)} />
              </Field>
            )
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canConfirm}
            loading={isSubmitting}
            onClick={() => method && onConfirm({ method, received: isCash ? receivedNum : undefined, reference: reference || undefined })}
          >
            Confirm Payment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import { HandCoins } from "lucide-react";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useInstallmentMutations } from "@/hooks/use-installments";
import { ApiClientError } from "@/lib/api/client";
import { cn, formatCurrency } from "@/lib/utils";
import type { InstallmentPayment, InstallmentPlan } from "@/types";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Collects a payment on a plan. Suggests the amount currently due (overdue
 * + next installment) with one-tap presets; the server allocates it to the
 * oldest unpaid installments first.
 */
export function CollectPaymentModal({
  plan,
  open,
  onOpenChange,
  currency,
  onCollected,
}: {
  plan: InstallmentPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  onCollected?: (payment: InstallmentPayment) => void;
}) {
  const { toast } = useToast();
  const methods = usePaymentMethods();
  const { collect } = useInstallmentMutations();
  const money = (v: number | string) => formatCurrency(v, currency);

  const balance = Number(plan.balance);
  const overdue = Number(plan.overdue_amount ?? 0);
  const nextUnpaid = plan.schedules?.find((s) => s.status !== "paid");
  const nextRemaining = nextUnpaid ? Number(nextUnpaid.amount) - Number(nextUnpaid.paid_amount) : 0;
  // Overdue first (it includes the oldest unpaid installment); otherwise the next one.
  const suggested = Math.min(balance, overdue > 0 ? overdue : nextRemaining || balance);

  const [amount, setAmount] = useState<string>("");
  const [methodId, setMethodId] = useState<string>("");
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Re-seeds the form each time the modal opens for a (possibly updated) plan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmount(suggested > 0 ? suggested.toFixed(2) : "");
    setDate(today());
    setReference("");
    setNotes("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plan.id]);

  useEffect(() => {
    if (!methodId && methods.data?.length) {
      const cash = methods.data.find((m) => m.slug === "cash") ?? methods.data[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMethodId(String(cash.id));
    }
  }, [methods.data, methodId]);

  const presets = [
    nextRemaining > 0 && { label: "Next installment", value: nextRemaining },
    overdue > 0 && { label: "All overdue", value: overdue },
    balance > 0 && { label: "Full balance", value: balance },
  ].filter(Boolean) as { label: string; value: number }[];

  const submit = async () => {
    setError(null);
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (value > balance + 0.001) {
      setError(`The amount can't be more than the remaining balance (${money(balance)}).`);
      return;
    }
    try {
      const result = await collect.mutateAsync({
        id: plan.id,
        payload: {
          amount: value,
          payment_method_id: methodId ? Number(methodId) : null,
          payment_date: date,
          reference: reference || null,
          notes: notes || null,
        },
      });
      toast({ title: `${money(value)} collected`, description: `Receipt ${result.payment.receipt_number}`, variant: "success" });
      onCollected?.(result.payment);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.fieldError("amount") ?? err.message : "Something went wrong.");
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-brand" /> Collect payment
          </ModalTitle>
          <ModalDescription>
            {plan.plan_number} · {plan.customer?.name} · Balance {money(balance)}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          {presets.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {presets.map((p) => {
                const active = Number(amount) === Number(p.value.toFixed(2));
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setAmount(p.value.toFixed(2))}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      active ? "border-brand bg-brand-soft" : "border-border hover:bg-muted"
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
                    <p className="mt-0.5 text-base font-semibold text-foreground">{money(p.value)}</p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount" required>
              <Input type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 text-base font-semibold" />
            </Field>
            <Field label="Payment method">
              <Select value={methodId} onValueChange={setMethodId}>
                <SelectTrigger aria-label="Payment method" className="h-11">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {(methods.data ?? []).map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date" required>
              <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Reference" hint="Cheque / transaction no. (optional)">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
            </Field>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={collect.isPending}>
            Collect {amount && Number(amount) > 0 ? money(Number(amount)) : ""}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

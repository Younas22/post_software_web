"use client";

import { useMemo, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { useReturnsForSale, useCreateReturn } from "@/hooks/use-returns";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import type { Sale } from "@/types";

export function ReturnModal({
  open,
  onOpenChange,
  sale,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  currency: string;
}) {
  const { toast } = useToast();
  const existingReturns = useReturnsForSale(open ? sale.id : undefined);
  const createReturn = useCreateReturn();
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const alreadyReturned = useMemo(() => {
    const map: Record<number, number> = {};
    for (const ret of existingReturns.data?.data ?? []) {
      for (const item of ret.items ?? []) {
        map[item.sale_item_id] = (map[item.sale_item_id] ?? 0) + item.quantity;
      }
    }
    return map;
  }, [existingReturns.data]);

  const toggle = (saleItemId: number, remaining: number, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[saleItemId] = remaining;
      else delete next[saleItemId];
      return next;
    });
  };

  const submit = async () => {
    setError(null);
    const items = Object.entries(selected)
      .filter(([, qty]) => qty > 0)
      .map(([saleItemId, quantity]) => ({ sale_item_id: Number(saleItemId), quantity }));

    if (items.length === 0) {
      setError("Select at least one item to return.");
      return;
    }

    try {
      await createReturn.mutateAsync({ saleId: sale.id, payload: { reason: reason || null, items } });
      toast({ title: "Return processed", variant: "success" });
      onOpenChange(false);
      setSelected({});
      setReason("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Return items — {sale.invoice_number}</ModalTitle>
          <ModalDescription>Select the items and quantities being returned.</ModalDescription>
        </ModalHeader>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto">
          {error && <Alert variant="error">{error}</Alert>}

          <div className="divide-y divide-border rounded-lg border border-border">
            {sale.items?.map((item) => {
              const returned = alreadyReturned[item.id] ?? 0;
              const remaining = item.quantity - returned;
              const checked = item.id in selected;
              return (
                <div key={item.id} className="flex items-center gap-3 p-3">
                  <Checkbox
                    disabled={remaining <= 0}
                    checked={checked}
                    onCheckedChange={(c) => toggle(item.id, remaining, !!c)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.product?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Purchased {item.quantity} · {remaining > 0 ? `${remaining} returnable` : "Fully returned"}
                    </p>
                  </div>
                  {checked && (
                    <Input
                      type="number"
                      min={1}
                      max={remaining}
                      value={selected[item.id]}
                      onChange={(e) => setSelected((prev) => ({ ...prev, [item.id]: Math.min(remaining, Math.max(1, Number(e.target.value))) }))}
                      className="h-9 w-20"
                    />
                  )}
                  <span className="w-20 shrink-0 text-right text-sm font-medium text-foreground">
                    {/* Mirrors ReturnService's own math (line_total / quantity * returned qty) — a preview only; the real refund_amount comes back from the API. */}
                    {formatCurrency((Number(item.line_total) / (item.quantity || 1)) * (selected[item.id] ?? 0), currency)}
                  </span>
                </div>
              );
            })}
          </div>

          <Field label="Reason" hint="Optional">
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={createReturn.isPending} onClick={submit}>
            Process Return
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

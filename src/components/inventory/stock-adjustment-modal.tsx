"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { ProductCombobox } from "@/components/shared/product-combobox";
import { useToast } from "@/components/ui/toast";
import { inventoryService } from "@/services/inventory.service";
import { ApiClientError } from "@/lib/api/client";
import type { Branch, Product } from "@/types";

const REASONS = [
  { value: "recount", label: "Stock count correction" },
  { value: "damaged", label: "Damaged / expired" },
  { value: "loss", label: "Theft / loss" },
  { value: "found", label: "Found / extra stock" },
  { value: "other", label: "Other" },
];

export function StockAdjustmentModal({
  open,
  onOpenChange,
  branch,
  initialProduct,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  initialProduct?: Product | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(REASONS[0].value);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // initialProduct can arrive asynchronously (e.g. resolved from a
  // ?product_id= query param after this component has already mounted with
  // null) — sync it in whenever it changes, not just on first render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing an external prop (arrives async from a query-param lookup) into local combobox state
    if (initialProduct) setProduct(initialProduct);
  }, [initialProduct]);

  const adjust = useMutation({
    mutationFn: inventoryService.adjust,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports", "inventory"] });
      toast({ title: "Stock adjusted", variant: "success" });
      reset();
      onOpenChange(false);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Something went wrong."),
  });

  const reset = () => {
    setProduct(null);
    setQuantity("");
    setReason(REASONS[0].value);
    setNotes("");
    setError(null);
  };

  const submit = () => {
    setError(null);
    const qty = Number(quantity);
    if (!branch) {
      setError("Select a branch first.");
      return;
    }
    if (!product) {
      setError("Select a product.");
      return;
    }
    if (!qty || qty <= 0) {
      setError("Enter a quantity greater than 0.");
      return;
    }
    const reasonLabel = REASONS.find((r) => r.value === reason)?.label ?? "Adjustment";
    adjust.mutate({
      branch_id: branch.id,
      product_id: product.id,
      quantity: direction === "increase" ? qty : -qty,
      notes: notes ? `${reasonLabel} — ${notes}` : reasonLabel,
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>Adjust stock</ModalTitle>
          <ModalDescription>{branch ? `Branch: ${branch.name}` : "Select a branch to continue."}</ModalDescription>
        </ModalHeader>

        <div className="flex flex-col gap-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Field label="Product" required>
            <ProductCombobox value={product} onSelect={setProduct} disabled={!branch} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Direction" required>
              <Select value={direction} onValueChange={(v) => setDirection(v as "increase" | "decrease")}>
                <SelectTrigger aria-label="Direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase (+)</SelectItem>
                  <SelectItem value="decrease">Decrease (−)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantity" required>
              <Input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </Field>
          </div>

          <Field label="Reason" required>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger aria-label="Reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Notes" hint="Optional additional detail">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={adjust.isPending}>
            Save adjustment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

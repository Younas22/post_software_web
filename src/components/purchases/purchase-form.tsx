"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconButton } from "@/components/ui/icon-button";
import { ProductCombobox } from "@/components/shared/product-combobox";
import { SupplierCombobox } from "@/components/shared/supplier-combobox";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import type { CreatePurchasePayload, PurchaseItemPayload } from "@/services/purchases.service";
import type { Product, Supplier } from "@/types";

interface LineItem extends PurchaseItemPayload {
  key: string;
  product: Product;
}

export function PurchaseForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (payload: CreatePurchasePayload) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const { config } = useAuth();
  const { branch, branches, isPinned } = useActiveBranch();
  const currency = config?.business?.currency ?? "USD";

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [branchId, setBranchId] = useState<number | undefined>(branch?.id);
  const [invoiceReference, setInvoiceReference] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"pending" | "received">("received");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // The active branch resolves asynchronously (it's fetched, not known at
  // first render) — adopt it once available if the user hasn't already
  // picked a different one.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adopts the async-resolved active branch as the default once, without overriding a manual choice
    setBranchId((current) => current ?? branch?.id);
  }, [branch?.id]);

  const addProduct = (product: Product) => {
    if (items.some((i) => i.product_id === product.id)) return;
    setItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), product, product_id: product.id, quantity: 1, purchase_price: Number(product.purchase_price), discount: 0, tax: 0 },
    ]);
  };

  const updateItem = (key: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  };

  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const lineTotal = (item: LineItem) => item.quantity * item.purchase_price - (item.discount ?? 0) + (item.tax ?? 0);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.purchase_price, 0);
  const totalDiscount = items.reduce((sum, i) => sum + (i.discount ?? 0), 0);
  const totalTax = items.reduce((sum, i) => sum + (i.tax ?? 0), 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const submit = async () => {
    setError(null);
    if (!branchId) return setError("Select a branch.");
    if (!supplier) return setError("Select a supplier.");
    if (items.length === 0) return setError("Add at least one product.");

    try {
      await onSubmit({
        branch_id: branchId,
        supplier_id: supplier.id,
        invoice_reference: invoiceReference || null,
        purchase_date: purchaseDate,
        status,
        notes: notes || null,
        items: items.map(({ product_id, quantity, purchase_price, discount, tax }) => ({ product_id, quantity, purchase_price, discount, tax })),
      });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Purchase details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Supplier" required>
                <SupplierCombobox value={supplier} onSelect={setSupplier} />
              </Field>
              <Field label="Branch" required>
                <Select value={branchId ? String(branchId) : undefined} onValueChange={(v) => setBranchId(Number(v))} disabled={isPinned}>
                  <SelectTrigger aria-label="Branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {(isPinned && branch ? [branch] : branches).map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Invoice reference">
                <Input value={invoiceReference} onChange={(e) => setInvoiceReference(e.target.value)} />
              </Field>
              <Field label="Purchase date" required>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
              </Field>
              <Field label="Status" required>
                <Select value={status} onValueChange={(v) => setStatus(v as "pending" | "received")}>
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received (updates stock now)</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Items</h2>
              <div className="w-72">
                <ProductCombobox onSelect={addProduct} currency={currency} placeholder="Add a product…" />
              </div>
            </div>
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                No items yet — search above to add products.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-28">Price</TableHead>
                      <TableHead className="w-24">Discount</TableHead>
                      <TableHead className="w-24">Tax</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell className="font-medium text-foreground">{item.product.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            className="h-9 w-20"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.key, { quantity: Math.max(1, Number(e.target.value)) })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-9 w-24"
                            value={item.purchase_price}
                            onChange={(e) => updateItem(item.key, { purchase_price: Number(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-9 w-20"
                            value={item.discount}
                            onChange={(e) => updateItem(item.key, { discount: Number(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-9 w-20"
                            value={item.tax}
                            onChange={(e) => updateItem(item.key, { tax: Number(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">{formatCurrency(lineTotal(item), currency)}</TableCell>
                        <TableCell>
                          <IconButton aria-label={`Remove ${item.product.name}`} variant="danger" size="sm" onClick={() => removeItem(item.key)}>
                            <Trash2 />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="sticky top-20 space-y-3 p-5">
            <h2 className="text-sm font-semibold text-foreground">Summary</h2>
            <Row label="Subtotal" value={formatCurrency(subtotal, currency)} />
            <Row label="Discount" value={`− ${formatCurrency(totalDiscount, currency)}`} />
            <Row label="Tax" value={`+ ${formatCurrency(totalTax, currency)}`} />
            <div className="border-t border-border pt-3">
              <Row label="Grand Total" value={formatCurrency(grandTotal, currency)} bold />
            </div>
            <p className="text-xs text-muted-foreground">Final totals are calculated by the server on save.</p>
            <Button className="w-full" onClick={submit} loading={isSubmitting}>
              <Plus /> Create Purchase
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "text-base font-semibold text-foreground" : "font-medium text-foreground"}>{value}</span>
    </div>
  );
}

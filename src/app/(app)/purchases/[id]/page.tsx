"use client";

import { use, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Truck, Building2, Calendar, FileText } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePurchase, usePurchaseMutations } from "@/hooks/use-purchases";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PurchaseViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const purchaseId = Number(id);
  const { hasPermission, config } = useAuth();
  const { toast } = useToast();
  const { data: purchase, isLoading } = usePurchase(purchaseId);
  const { receive, cancel } = usePurchaseMutations();
  const [confirmAction, setConfirmAction] = useState<"receive" | "cancel" | null>(null);
  const currency = config?.business?.currency ?? "USD";

  if (isLoading || !purchase) return <LoadingState label="Loading purchase…" />;

  const handleConfirm = async () => {
    try {
      if (confirmAction === "receive") {
        await receive.mutateAsync(purchaseId);
        toast({ title: "Purchase received — stock updated", variant: "success" });
      } else if (confirmAction === "cancel") {
        await cancel.mutateAsync(purchaseId);
        toast({ title: "Purchase cancelled", variant: "success" });
      }
    } catch (err) {
      toast({ title: "Action failed", description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Purchases", href: "/purchases" }, { label: purchase.invoice_reference ?? `#${purchase.id}` }]} />
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{purchase.invoice_reference ?? `Purchase #${purchase.id}`}</h1>
            <StatusBadge status={purchase.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {purchase.status === "pending" && hasPermission("purchases.update") && (
            <Button onClick={() => setConfirmAction("receive")}>
              <CheckCircle2 /> Mark Received
            </Button>
          )}
          {purchase.status !== "cancelled" && hasPermission("purchases.cancel") && (
            <Button variant="danger" onClick={() => setConfirmAction("cancel")}>
              <XCircle /> Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto px-1 pb-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">{item.product?.name ?? `#${item.product_id}`}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.purchase_price, currency)}</TableCell>
                      <TableCell>{formatCurrency(item.discount, currency)}</TableCell>
                      <TableCell>{formatCurrency(item.tax, currency)}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">{formatCurrency(item.line_total, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2 border-t border-border p-5">
              <Row label="Subtotal" value={formatCurrency(purchase.subtotal, currency)} />
              <Row label="Discount" value={`− ${formatCurrency(purchase.discount, currency)}`} />
              <Row label="Tax" value={`+ ${formatCurrency(purchase.tax, currency)}`} />
              <Row label="Grand Total" value={formatCurrency(purchase.total, currency)} bold />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Truck className="size-4 text-muted-foreground" /> {purchase.supplier?.name ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="size-4 text-muted-foreground" /> {purchase.branch?.name ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="size-4 text-muted-foreground" /> {formatDate(purchase.purchase_date)}
              </div>
              {purchase.notes && (
                <div className="flex items-start gap-2 text-foreground">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {purchase.notes}
                </div>
              )}
              {purchase.supplier && (
                <Link href={`/suppliers/${purchase.supplier.id}`} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                  View supplier →
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction === "receive" ? "Mark this purchase as received?" : "Cancel this purchase?"}
        description={
          confirmAction === "receive"
            ? "This will add the purchased items to your stock."
            : "If this purchase was already received, stock will be reversed."
        }
        confirmLabel={confirmAction === "receive" ? "Mark Received" : "Cancel Purchase"}
        variant={confirmAction === "receive" ? "primary" : "danger"}
        loading={receive.isPending || cancel.isPending}
        onConfirm={handleConfirm}
      />
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

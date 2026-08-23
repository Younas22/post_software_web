"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Printer, Undo2, User as UserIcon, Building2, Calendar } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSale, useSaleReceipt } from "@/hooks/use-sales";
import { useAuth } from "@/lib/auth/auth-context";
import { ReturnModal } from "@/components/sales/return-modal";
import { Receipt } from "@/components/receipt/receipt";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const saleId = Number(id);
  const { hasPermission, config } = useAuth();
  const { data: sale, isLoading } = useSale(saleId);
  const { data: receipt } = useSaleReceipt(saleId);
  const [returnOpen, setReturnOpen] = useState(false);
  const currency = config?.business?.currency ?? "USD";

  if (isLoading || !sale) return <LoadingState label="Loading sale…" />;

  const canReturn = hasPermission("returns.process") && sale.status === "completed";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Sales History", href: "/sales" }, { label: sale.invoice_number }]} />
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{sale.invoice_number}</h1>
            <StatusBadge status={sale.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Print Receipt
          </Button>
          {canReturn && (
            <Button variant="danger" onClick={() => setReturnOpen(true)}>
              <Undo2 /> Return Items
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
                  {sale.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">{item.product?.name ?? `#${item.product_id}`}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_price, currency)}</TableCell>
                      <TableCell>{formatCurrency(item.discount, currency)}</TableCell>
                      <TableCell>{formatCurrency(item.tax, currency)}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">{formatCurrency(item.line_total, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2 border-t border-border p-5">
              <Row label="Subtotal" value={formatCurrency(sale.subtotal, currency)} />
              <Row label="Discount" value={`− ${formatCurrency(sale.discount, currency)}`} />
              <Row label="Tax" value={`+ ${formatCurrency(sale.tax, currency)}`} />
              <Row label="Total" value={formatCurrency(sale.total, currency)} bold />
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
                <UserIcon className="size-4 text-muted-foreground" /> {sale.customer?.name ?? "Walk-in Customer"}
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="size-4 text-muted-foreground" /> {sale.branch?.name ?? "—"} · Cashier: {sale.user?.name ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="size-4 text-muted-foreground" /> {formatDateTime(sale.sale_date)}
              </div>
              {sale.customer && (
                <Link href={`/customers/${sale.customer.id}`} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                  View customer →
                </Link>
              )}
            </CardContent>
          </Card>

          {sale.payments && sale.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sale.payments.map((p) => (
                  <Row key={p.id} label={p.payment_method?.name ?? "Payment"} value={formatCurrency(p.amount, currency)} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {receipt && (
        <div className="print-only">
          <Receipt data={receipt} currency={currency} />
        </div>
      )}

      <ReturnModal open={returnOpen} onOpenChange={setReturnOpen} sale={sale} currency={currency} />
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

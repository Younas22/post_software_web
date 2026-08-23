"use client";

import { use } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReturn } from "@/hooks/use-returns";
import { useAuth } from "@/lib/auth/auth-context";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const returnId = Number(id);
  const { config } = useAuth();
  const { data: saleReturn, isLoading } = useReturn(returnId);
  const currency = config?.business?.currency ?? "USD";

  if (isLoading || !saleReturn) return <LoadingState label="Loading return…" />;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Returns", href: "/returns" }, { label: saleReturn.reference }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">{saleReturn.reference}</h1>
        {saleReturn.sale && (
          <Link href={`/sales/${saleReturn.sale.id}`} className="mt-1 inline-block text-sm font-medium text-brand hover:underline">
            Original Invoice: {saleReturn.sale.invoice_number} →
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returned items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-1 pb-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Product</TableHead>
                  <TableHead>Returned Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Refund Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleReturn.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.product?.name ?? `#${item.product_id}`}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unit_price, currency)}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">{formatCurrency(item.refund_amount, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2 border-t border-border p-5">
            <Row label="Reason" value={saleReturn.reason ?? "—"} />
            <Row label="Date" value={formatDateTime(saleReturn.created_at)} />
            <Row label="Total Refund" value={formatCurrency(saleReturn.refund_amount, currency)} bold />
          </div>
        </CardContent>
      </Card>
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

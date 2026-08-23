"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Mail, Phone, MapPin, Package, DollarSign, ShoppingBag } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { useSupplier } from "@/hooks/use-suppliers";
import { useAuth } from "@/lib/auth/auth-context";
import { purchasesService } from "@/services/purchases.service";
import { reportsService } from "@/services/reports.service";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export default function SupplierViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supplierId = Number(id);
  const { hasPermission, config } = useAuth();
  const { data: supplier, isLoading } = useSupplier(supplierId);
  const currency = config?.business?.currency ?? "USD";

  const summary = useQuery({
    queryKey: ["reports", "purchases", "supplier", supplierId],
    queryFn: () => reportsService.purchases({ supplier_id: supplierId, per_page: 1 }),
    enabled: !!supplierId,
  });
  const recentPurchases = useQuery({
    queryKey: ["purchases", "by-supplier", supplierId],
    queryFn: () => purchasesService.list({ supplier_id: supplierId, per_page: 8 }),
    enabled: !!supplierId,
  });

  if (isLoading || !supplier) return <LoadingState label="Loading supplier…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Suppliers", href: "/suppliers" }, { label: supplier.name }]} />
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={supplier.name} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{supplier.name}</h1>
              <StatusBadge status={supplier.status} />
            </div>
          </div>
        </div>
        {hasPermission("suppliers.update") && (
          <Button variant="outline" asChild>
            <Link href={`/suppliers/${supplierId}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
        <StatCard label="Total Purchases" value={formatCurrency(summary.data?.summary.total ?? 0, currency)} icon={DollarSign} tone="brand" isLoading={summary.isLoading} />
        <StatCard label="Purchase Orders" value={formatNumber(summary.data?.summary.purchase_count ?? 0)} icon={Package} isLoading={summary.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent purchases</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentPurchases.isLoading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading…</div>
            ) : (recentPurchases.data?.data.length ?? 0) === 0 ? (
              <EmptyState icon={ShoppingBag} title="No purchases yet" description="Purchase orders from this supplier will appear here." />
            ) : (
              <div className="overflow-x-auto px-1 pb-1">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Reference</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPurchases.data?.data.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium text-foreground">
                          <Link href={`/purchases/${purchase.id}`} className="hover:text-brand hover:underline">
                            {purchase.invoice_reference ?? `#${purchase.id}`}
                          </Link>
                        </TableCell>
                        <TableCell>{formatCurrency(purchase.total, currency)}</TableCell>
                        <TableCell><StatusBadge status={purchase.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(purchase.purchase_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Phone className="size-4 text-muted-foreground" /> {supplier.phone ?? "—"}
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="size-4 text-muted-foreground" /> {supplier.email ?? "—"}
            </div>
            <div className="flex items-start gap-2 text-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {supplier.address ?? "—"}
            </div>
            {supplier.notes && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="mt-1 text-foreground">{supplier.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

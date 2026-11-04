"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Mail, Phone, MapPin, ShoppingBag, DollarSign, ShoppingCart } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { useCustomer } from "@/hooks/use-customers";
import { useAuth } from "@/lib/auth/auth-context";
import { salesService } from "@/services/sales.service";
import { reportsService } from "@/services/reports.service";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { useTerms } from "@/hooks/use-branding";

export default function CustomerViewPage({ params }: { params: Promise<{ id: string }> }) {
  const terms = useTerms();
  const { id } = use(params);
  const customerId = Number(id);
  const { hasPermission, config } = useAuth();
  const { data: customer, isLoading } = useCustomer(customerId);
  const currency = config?.business?.currency ?? "USD";

  const summary = useQuery({
    queryKey: ["reports", "customers", customerId],
    queryFn: () => reportsService.customers({ customer_id: customerId, per_page: 1 }),
    enabled: !!customerId,
  });
  const recentSales = useQuery({
    queryKey: ["sales", "by-customer", customerId],
    queryFn: () => salesService.list({ customer_id: customerId, per_page: 8 }),
    enabled: !!customerId,
  });

  if (isLoading || !customer) return <LoadingState label={`Loading ${terms.customer.toLowerCase()}…`} />;

  const row = summary.data?.customers.data[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: terms.customers, href: "/customers" }, { label: customer.name }]} />
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={customer.name} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{customer.name}</h1>
              <StatusBadge status={customer.status} />
            </div>
          </div>
        </div>
        {hasPermission("customers.update") && (
          <Button variant="outline" asChild>
            <Link href={`/customers/${customerId}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
        <StatCard label={`Total ${terms.sales}`} value={formatCurrency(row?.total_spent ?? 0, currency)} icon={DollarSign} tone="brand" isLoading={summary.isLoading} />
        <StatCard label="Orders" value={formatNumber(row?.transaction_count ?? 0)} icon={ShoppingCart} isLoading={summary.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentSales.isLoading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading…</div>
            ) : (recentSales.data?.data.length ?? 0) === 0 ? (
              <EmptyState icon={ShoppingBag} title="No transactions yet" description={`${terms.sales} for this ${terms.customer.toLowerCase()} will appear here.`} />
            ) : (
              <div className="overflow-x-auto px-1 pb-1">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Invoice</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.data?.data.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium text-foreground">
                          <Link href={`/sales/${sale.id}`} className="hover:text-brand hover:underline">
                            {sale.invoice_number}
                          </Link>
                        </TableCell>
                        <TableCell>{formatCurrency(sale.total, currency)}</TableCell>
                        <TableCell><StatusBadge status={sale.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(sale.sale_date)}</TableCell>
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
              <Phone className="size-4 text-muted-foreground" /> {customer.phone ?? "—"}
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="size-4 text-muted-foreground" /> {customer.email ?? "—"}
            </div>
            <div className="flex items-start gap-2 text-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {customer.address ?? "—"}
            </div>
            {customer.notes && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="mt-1 text-foreground">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

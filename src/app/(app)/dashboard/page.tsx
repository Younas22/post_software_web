"use client";

import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Users,
  Receipt,
  TrendingUp,
  Package,
  Building2,
} from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useDashboard } from "@/hooks/use-dashboard";
import { useSalesReport } from "@/hooks/use-reports";
import { useLowStock } from "@/hooks/use-inventory";
import { useDateRangePreset } from "@/hooks/use-date-range-preset";
import { StatCard } from "@/components/shared/stat-card";
import { RangePresetTabs } from "@/components/shared/range-preset-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { user, config } = useAuth();
  const { branchId } = useActiveBranch();
  const dashboard = useDashboard(branchId);
  const lowStock = useLowStock({ per_page: 5, branch_id: branchId ?? undefined }, !!branchId);
  const { preset, setPreset, customRange, setCustomRange, range } = useDateRangePreset("7d");
  const salesReport = useSalesReport(
    { ...range, branch_id: branchId ?? undefined, per_page: 1 },
    !!branchId
  );

  const currency = config?.business?.currency ?? "USD";
  const money = (v: number | string) => formatCurrency(v, currency);
  const data = dashboard.data;
  const hasAnySales = (data?.recent_sales.length ?? 0) > 0 || (data?.today.orders_count ?? 0) > 0;

  // A Super Admin (or any account with no business_id) has no tenant to
  // report on — the dashboard is a business-scoped view by design, so show
  // one clear explanation instead of six broken widgets.
  if (dashboard.isError && !dashboard.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Building2 className="size-6" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">No business dashboard to show</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {dashboard.error instanceof ApiClientError
              ? dashboard.error.message
              : "This account isn't associated with a business."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening in your business today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Today's Sales" value={money(data?.today.sales_total ?? 0)} icon={DollarSign} tone="brand" isLoading={dashboard.isLoading} />
        <StatCard label="Today's Orders" value={formatNumber(data?.today.orders_count ?? 0)} icon={ShoppingCart} isLoading={dashboard.isLoading} />
        <StatCard
          label="Low Stock"
          value={formatNumber(data?.low_stock_count ?? 0)}
          icon={AlertTriangle}
          tone={data && data.low_stock_count > 0 ? "warning" : "default"}
          isLoading={dashboard.isLoading}
        />
        <StatCard label="Customers" value={formatNumber(data?.customers_count ?? 0)} icon={Users} isLoading={dashboard.isLoading} />
        <StatCard label="Today's Expenses" value={money(data?.today.expenses_total ?? 0)} icon={Receipt} isLoading={dashboard.isLoading} />
        <StatCard
          label="Est. Profit"
          value={money(data?.today.estimated_profit ?? 0)}
          icon={TrendingUp}
          tone={data && data.today.estimated_profit >= 0 ? "success" : "error"}
          isLoading={dashboard.isLoading}
        />
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle>Sales overview</CardTitle>
          <RangePresetTabs value={preset} onChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} />
        </CardHeader>
        <CardContent>
          {salesReport.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Metric label="Total Sales" value={money(salesReport.data?.summary.total ?? 0)} />
              <Metric label="Orders" value={formatNumber(salesReport.data?.summary.transaction_count ?? 0)} />
              <Metric
                label="Avg Order"
                value={money(
                  salesReport.data?.summary.transaction_count
                    ? Number(salesReport.data.summary.total) / salesReport.data.summary.transaction_count
                    : 0
                )}
              />
              <Metric label="Discount" value={money(salesReport.data?.summary.discount ?? 0)} />
              <Metric label="Tax" value={money(salesReport.data?.summary.tax ?? 0)} />
              <Metric label="Net Sales" value={money(salesReport.data?.summary.subtotal ?? 0)} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dashboard.isLoading ? (
              <div className="space-y-3 px-5 pb-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !hasAnySales ? (
              <EmptyState
                icon={ShoppingCart}
                title="No sales yet"
                description="Sales you make will show up here in real time."
                action={
                  user?.permissions.includes("sales.create") ? (
                    <Link href="/pos" className="text-sm font-medium text-brand hover:underline">
                      Go to POS →
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto px-1 pb-1">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.recent_sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium text-foreground">
                          <Link href={`/sales/${sale.id}`} className="hover:text-brand hover:underline">
                            {sale.invoice_number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{sale.customer?.name ?? "Walk-in"}</TableCell>
                        <TableCell>{money(sale.total)}</TableCell>
                        <TableCell>
                          <StatusBadge status={sale.status} />
                        </TableCell>
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
            <CardTitle>Top products (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dashboard.isLoading ? (
              <div className="space-y-3 px-5 pb-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (data?.top_products.length ?? 0) === 0 ? (
              <EmptyState icon={Package} title="No product sales yet" description="Your best sellers will appear here." />
            ) : (
              <div className="overflow-x-auto px-1 pb-1">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Product</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.top_products.map((row) => (
                      <TableRow key={row.product_id}>
                        <TableCell className="font-medium text-foreground">{row.product?.name ?? `#${row.product_id}`}</TableCell>
                        <TableCell>{formatNumber(row.units_sold)}</TableCell>
                        <TableCell>{money(row.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low stock</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {lowStock.isLoading ? (
            <div className="space-y-3 px-5 pb-5">
              <CardSkeleton />
            </div>
          ) : (lowStock.data?.data.length ?? 0) === 0 ? (
            <EmptyState icon={Package} title="Stock levels look healthy" description="No products are at or below their minimum stock." />
          ) : (
            <div className="overflow-x-auto px-1 pb-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Minimum Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.data?.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-foreground">{row.product?.name}</TableCell>
                      <TableCell className="text-error">{row.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{row.product?.minimum_stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

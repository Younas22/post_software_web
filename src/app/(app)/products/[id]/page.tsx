"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Package, ArrowUpRight, ArrowDownRight, Settings2 } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProduct } from "@/hooks/use-products";
import { useAuth } from "@/lib/auth/auth-context";
import { inventoryService } from "@/services/inventory.service";
import { storageUrl } from "@/lib/api/client";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { useTerms } from "@/hooks/use-branding";

export default function ProductViewPage({ params }: { params: Promise<{ id: string }> }) {
  const terms = useTerms();
  const { id } = use(params);
  const productId = Number(id);
  const { hasPermission, config } = useAuth();
  const { data: product, isLoading } = useProduct(productId);
  const movements = useQuery({
    queryKey: ["products", productId, "movements"],
    queryFn: () => inventoryService.productMovements(productId, { per_page: 8 }),
    enabled: !!productId,
  });

  const currency = config?.business?.currency ?? "USD";

  if (isLoading || !product) {
    return <LoadingState label={`Loading ${terms.product.toLowerCase()}…`} />;
  }

  const margin = Number(product.sale_price) - Number(product.purchase_price);
  const marginPct = Number(product.purchase_price) > 0 ? (margin / Number(product.purchase_price)) * 100 : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: terms.products, href: "/products" }, { label: product.name }]} />
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={product.name} src={storageUrl(product.image)} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{product.name}</h1>
              <p className="text-sm text-muted-foreground">SKU {product.sku}</p>
            </div>
          </div>
        </div>
        {hasPermission("products.update") && (
          <Button variant="outline" asChild>
            <Link href={`/products/${productId}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Info label="Category" value={product.category?.name ?? "—"} />
              <Info label="Brand" value={product.brand?.name ?? "—"} />
              <Info label="Barcode" value={product.barcode ?? "—"} />
              <Info label="Unit" value={product.unit} />
              <Info label="Status" value={<StatusBadge status={product.status} />} />
              <Info label="Tax rate" value={product.tax_rate ? `${product.tax_rate}%` : "Business default"} />
              {product.description && (
                <div className="col-span-full">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm text-foreground">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent stock activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {movements.isLoading ? (
                <div className="p-5 text-sm text-muted-foreground">Loading…</div>
              ) : (movements.data?.data.length ?? 0) === 0 ? (
                <EmptyState icon={Package} title="No stock movements yet" description={`${terms.purchases}, ${terms.sales.toLowerCase()}, and adjustments will appear here.`} />
              ) : (
                <div className="overflow-x-auto px-1 pb-1">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Type</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.data?.data.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="capitalize">{m.type.replace("_", " ")}</TableCell>
                          <TableCell className="text-muted-foreground">{m.branch?.name ?? "—"}</TableCell>
                          <TableCell>
                            <span className={m.quantity >= 0 ? "inline-flex items-center gap-1 text-success" : "inline-flex items-center gap-1 text-error"}>
                              {m.quantity >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                              {m.quantity >= 0 ? "+" : ""}
                              {m.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{m.balance_after}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDateTime(m.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label={`${terms.purchase} price`} value={formatCurrency(product.purchase_price, currency)} />
              <Row label={`${terms.sale} price`} value={formatCurrency(product.sale_price, currency)} />
              <Row
                label="Margin"
                value={
                  <span className={margin >= 0 ? "text-success" : "text-error"}>
                    {formatCurrency(margin, currency)} {marginPct !== null && `(${marginPct.toFixed(1)}%)`}
                  </span>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Stock</CardTitle>
              {hasPermission("inventory.adjust") && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/inventory?product_id=${productId}`}>
                    <Settings2 className="size-3.5" /> Adjust
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <Row
                label="Current stock"
                value={
                  <Badge variant={(product.stock ?? 0) <= product.minimum_stock ? "warning" : "success"}>
                    {formatNumber(product.stock ?? 0)} {product.unit}
                  </Badge>
                }
              />
              <Row label="Minimum stock" value={formatNumber(product.minimum_stock)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

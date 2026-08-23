"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Boxes, DollarSign, AlertTriangle, XCircle, Settings2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useInventoryReport } from "@/hooks/use-reports";
import { useInventoryList } from "@/hooks/use-inventory";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory.service";
import { productsService } from "@/services/products.service";
import { StatCard } from "@/components/shared/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FilterBar, FilterSelect } from "@/components/ui/filter";
import { StockAdjustmentModal } from "@/components/inventory/stock-adjustment-modal";
import { useProduct } from "@/hooks/use-products";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import type { Inventory, StockMovement } from "@/types";

export default function InventoryPage() {
  const { hasPermission, config } = useAuth();
  const { branch, branches, isPinned } = useActiveBranch();
  const searchParams = useSearchParams();

  const [branchFilter, setBranchFilter] = useState<string | undefined>(branch ? String(branch.id) : undefined);
  const [page, setPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const effectiveBranchId = branchFilter ? Number(branchFilter) : undefined;
  const currency = config?.business?.currency ?? "USD";

  const report = useInventoryReport({ branch_id: effectiveBranchId, per_page: 1 });
  const inventoryList = useInventoryList({ branch_id: effectiveBranchId, page, per_page: 15 });
  const movements = useQuery({
    queryKey: ["inventory", "movements", effectiveBranchId, movementsPage],
    queryFn: () => inventoryService.movements({ branch_id: effectiveBranchId, page: movementsPage, per_page: 15 }),
  });
  const productCount = useQuery({
    queryKey: ["products", "count"],
    queryFn: () => productsService.list({ per_page: 1 }),
  });

  const preselectedProductId = searchParams.get("product_id");
  const { data: preselectedProduct } = useProduct(preselectedProductId ? Number(preselectedProductId) : undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opens the modal once the ?product_id= lookup resolves
    if (preselectedProduct) setAdjustOpen(true);
  }, [preselectedProduct]);

  const inventoryColumns: DataTableColumn<Inventory>[] = [
    { key: "product", header: "Product", render: (r) => <span className="font-medium text-foreground">{r.product?.name}</span> },
    { key: "sku", header: "SKU", render: (r) => <span className="text-muted-foreground">{r.product?.sku}</span> },
    { key: "branch", header: "Branch", render: (r) => r.branch?.name },
    { key: "stock", header: "Stock", render: (r) => r.quantity },
    { key: "min", header: "Minimum Stock", render: (r) => r.product?.minimum_stock },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const min = r.product?.minimum_stock ?? 0;
        if (r.quantity <= 0) return <Badge variant="error">Out of stock</Badge>;
        if (r.quantity <= min) return <Badge variant="warning">Low stock</Badge>;
        return <Badge variant="success">In stock</Badge>;
      },
    },
  ];

  const movementColumns: DataTableColumn<StockMovement>[] = [
    { key: "product", header: "Product", render: (m) => <span className="font-medium text-foreground">{m.product?.name}</span> },
    { key: "type", header: "Type", render: (m) => <span className="capitalize">{m.type.replace("_", " ")}</span> },
    {
      key: "quantity",
      header: "Quantity",
      render: (m) => (
        <span className={m.quantity >= 0 ? "inline-flex items-center gap-1 text-success" : "inline-flex items-center gap-1 text-error"}>
          {m.quantity >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {m.quantity >= 0 ? "+" : ""}
          {m.quantity}
        </span>
      ),
    },
    { key: "branch", header: "Branch", render: (m) => m.branch?.name },
    { key: "user", header: "User", render: (m) => m.user?.name ?? "System" },
    { key: "date", header: "Date", render: (m) => formatDateTime(m.created_at) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track stock levels and movements across your business.</p>
        </div>
        {hasPermission("inventory.adjust") && (
          <Button onClick={() => setAdjustOpen(true)}>
            <Settings2 /> Adjust Stock
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Products" value={formatNumber(productCount.data?.meta && "total" in productCount.data.meta ? productCount.data.meta.total : 0)} icon={Boxes} isLoading={productCount.isLoading} />
        <StatCard label="Stock Value" value={formatCurrency(report.data?.summary.stock_value ?? 0, currency)} icon={DollarSign} tone="brand" isLoading={report.isLoading} />
        <StatCard
          label="Low Stock"
          value={formatNumber(report.data?.summary.low_stock_count ?? 0)}
          icon={AlertTriangle}
          tone={report.data && report.data.summary.low_stock_count > 0 ? "warning" : "default"}
          isLoading={report.isLoading}
        />
        <StatCard
          label="Out of Stock"
          value={formatNumber((report.data?.summary as { out_of_stock_count?: number })?.out_of_stock_count ?? 0)}
          icon={XCircle}
          tone={(report.data?.summary as { out_of_stock_count?: number })?.out_of_stock_count ? "error" : "default"}
          isLoading={report.isLoading}
        />
      </div>

      {!isPinned && branches.length > 1 && (
        <FilterBar>
          <FilterSelect
            label="Branch"
            placeholder="All branches"
            value={branchFilter}
            onChange={(v) => { setBranchFilter(v); setPage(1); }}
            options={branches.map((b) => ({ label: b.name, value: String(b.id) }))}
          />
        </FilterBar>
      )}

      <Tabs defaultValue="levels">
        <TabsList>
          <TabsTrigger value="levels">Stock Levels</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>
        <TabsContent value="levels">
          <DataTable
            columns={inventoryColumns}
            rows={inventoryList.data?.data ?? []}
            isLoading={inventoryList.isLoading}
            meta={inventoryList.data?.meta}
            onPageChange={setPage}
            emptyIcon={Boxes}
            emptyTitle="No inventory records yet"
            emptyDescription="Stock levels appear once products are purchased or adjusted."
          />
        </TabsContent>
        <TabsContent value="movements">
          <DataTable
            columns={movementColumns}
            rows={movements.data?.data ?? []}
            isLoading={movements.isLoading}
            meta={movements.data?.meta}
            onPageChange={setMovementsPage}
            emptyIcon={Boxes}
            emptyTitle="No stock movements yet"
            emptyDescription="Every purchase, sale, return, and adjustment will be logged here."
          />
        </TabsContent>
      </Tabs>

      <StockAdjustmentModal open={adjustOpen} onOpenChange={setAdjustOpen} branch={branch} initialProduct={preselectedProduct} />
    </div>
  );
}

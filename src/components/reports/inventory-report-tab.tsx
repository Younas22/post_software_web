"use client";

import { useState } from "react";
import { Boxes, DollarSign, AlertTriangle, XCircle } from "lucide-react";
import { useInventoryReport } from "@/hooks/use-reports";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { StatCard } from "@/components/shared/stat-card";
import { FilterBar, FilterSelect } from "@/components/ui/filter";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Inventory } from "@/types";

export function InventoryReportTab({ currency }: { currency: string }) {
  const { branches, isPinned, branchId: activeBranchId } = useActiveBranch();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const report = useInventoryReport({ branch_id: branchId ? Number(branchId) : undefined, page, per_page: 10 }, !!activeBranchId);
  const summary = report.data?.summary;

  const columns: DataTableColumn<Inventory>[] = [
    { key: "product", header: "Product", render: (r) => <span className="font-medium text-foreground">{r.product?.name}</span> },
    { key: "branch", header: "Branch", render: (r) => r.branch?.name },
    { key: "stock", header: "Stock", render: (r) => r.quantity },
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

  return (
    <div className="space-y-4">
      {!isPinned && branches.length > 1 && (
        <FilterBar>
          <FilterSelect label="Branch" placeholder="All branches" value={branchId} onChange={(v) => { setBranchId(v); setPage(1); }} options={branches.map((b) => ({ label: b.name, value: String(b.id) }))} />
        </FilterBar>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Stock Units" value={formatNumber(summary?.total_units ?? 0)} icon={Boxes} isLoading={report.isLoading} />
        <StatCard label="Stock Value" value={formatCurrency(summary?.stock_value ?? 0, currency)} icon={DollarSign} tone="brand" isLoading={report.isLoading} />
        <StatCard label="Low Stock" value={formatNumber(summary?.low_stock_count ?? 0)} icon={AlertTriangle} tone={summary && summary.low_stock_count > 0 ? "warning" : "default"} isLoading={report.isLoading} />
        <StatCard label="Out of Stock" value={formatNumber(summary?.out_of_stock_count ?? 0)} icon={XCircle} tone={summary?.out_of_stock_count ? "error" : "default"} isLoading={report.isLoading} />
      </div>
      <DataTable columns={columns} rows={report.data?.inventory.data ?? []} isLoading={report.isLoading} meta={report.data?.inventory.meta} onPageChange={setPage} emptyTitle="No inventory records" />
    </div>
  );
}

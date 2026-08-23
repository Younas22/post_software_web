"use client";

import { useState } from "react";
import { useProductsReport } from "@/hooks/use-reports";
import { useDateRangePreset } from "@/hooks/use-date-range-preset";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { ReportFiltersBar } from "./report-filters-bar";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ProductPerformanceRow } from "@/services/reports.service";

export function ProductsReportTab({ currency }: { currency: string }) {
  const { preset, setPreset, customRange, setCustomRange, range } = useDateRangePreset("30d");
  const { branchId: activeBranchId } = useActiveBranch();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const report = useProductsReport({ ...range, branch_id: branchId ? Number(branchId) : undefined, page, per_page: 15 }, !!activeBranchId);

  const columns: DataTableColumn<ProductPerformanceRow>[] = [
    { key: "product", header: "Product", render: (r) => <span className="font-medium text-foreground">{r.product?.name ?? `#${r.product_id}`}</span> },
    { key: "sku", header: "SKU", render: (r) => <span className="text-muted-foreground">{r.product?.sku}</span> },
    { key: "units", header: "Units Sold", render: (r) => formatNumber(r.quantity_sold) },
    { key: "revenue", header: "Revenue", render: (r) => formatCurrency(r.revenue, currency) },
  ];

  return (
    <div className="space-y-4">
      <ReportFiltersBar preset={preset} onPresetChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} branchId={branchId} onBranchChange={setBranchId} />
      <DataTable
        columns={columns}
        rows={report.data?.products.data ?? []}
        isLoading={report.isLoading}
        meta={report.data?.products.meta}
        onPageChange={setPage}
        getRowKey={(r) => r.product_id}
        emptyTitle="No product sales in this period"
      />
    </div>
  );
}

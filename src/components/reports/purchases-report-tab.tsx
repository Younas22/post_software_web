"use client";

import { useState } from "react";
import { DollarSign, Package } from "lucide-react";
import { usePurchasesReport } from "@/hooks/use-reports";
import { useDateRangePreset } from "@/hooks/use-date-range-preset";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { ReportFiltersBar } from "./report-filters-bar";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Purchase } from "@/types";

export function PurchasesReportTab({ currency }: { currency: string }) {
  const { preset, setPreset, customRange, setCustomRange, range } = useDateRangePreset("7d");
  const { branchId: activeBranchId } = useActiveBranch();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const report = usePurchasesReport({ ...range, branch_id: branchId ? Number(branchId) : undefined, page, per_page: 10 }, !!activeBranchId);
  const summary = report.data?.summary;

  const columns: DataTableColumn<Purchase>[] = [
    { key: "reference", header: "Reference", render: (p) => <span className="font-medium text-foreground">{p.invoice_reference ?? `#${p.id}`}</span> },
    { key: "supplier", header: "Supplier", render: (p) => p.supplier?.name ?? "—" },
    { key: "branch", header: "Branch", render: (p) => p.branch?.name ?? "—" },
    { key: "total", header: "Total", render: (p) => formatCurrency(p.total, currency) },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "date", header: "Date", render: (p) => formatDate(p.purchase_date) },
  ];

  return (
    <div className="space-y-4">
      <ReportFiltersBar preset={preset} onPresetChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} branchId={branchId} onBranchChange={setBranchId} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Purchases" value={String(summary?.purchase_count ?? 0)} icon={Package} isLoading={report.isLoading} />
        <StatCard label="Total Cost" value={formatCurrency(summary?.total ?? 0, currency)} icon={DollarSign} tone="brand" isLoading={report.isLoading} />
        <StatCard label="Tax" value={formatCurrency(summary?.tax ?? 0, currency)} icon={DollarSign} isLoading={report.isLoading} />
      </div>
      <DataTable columns={columns} rows={report.data?.purchases.data ?? []} isLoading={report.isLoading} meta={report.data?.purchases.meta} onPageChange={setPage} emptyTitle="No purchases in this period" />
    </div>
  );
}

"use client";

import { DollarSign, ShoppingCart, Percent, Receipt as ReceiptIcon } from "lucide-react";
import { useSalesReport } from "@/hooks/use-reports";
import { useDateRangePreset } from "@/hooks/use-date-range-preset";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { ReportFiltersBar } from "./report-filters-bar";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useState } from "react";
import type { Sale } from "@/types";

export function SalesReportTab({ currency }: { currency: string }) {
  const { preset, setPreset, customRange, setCustomRange, range } = useDateRangePreset("7d");
  const { branchId: activeBranchId } = useActiveBranch();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const filters = { ...range, branch_id: branchId ? Number(branchId) : undefined, page, per_page: 10 };
  const report = useSalesReport(filters, !!activeBranchId);
  const summary = report.data?.summary;

  const columns: DataTableColumn<Sale>[] = [
    { key: "invoice", header: "Invoice", render: (s) => <span className="font-medium text-foreground">{s.invoice_number}</span> },
    { key: "customer", header: "Customer", render: (s) => s.customer?.name ?? "Walk-in" },
    { key: "cashier", header: "Cashier", render: (s) => s.user?.name ?? "—" },
    { key: "branch", header: "Branch", render: (s) => s.branch?.name ?? "—" },
    { key: "total", header: "Total", render: (s) => formatCurrency(s.total, currency) },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
    { key: "date", header: "Date", render: (s) => formatDateTime(s.sale_date) },
  ];

  return (
    <div className="space-y-4">
      <ReportFiltersBar preset={preset} onPresetChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} branchId={branchId} onBranchChange={setBranchId} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Sales" value={formatCurrency(summary?.total ?? 0, currency)} icon={DollarSign} tone="brand" isLoading={report.isLoading} />
        <StatCard label="Orders" value={String(summary?.transaction_count ?? 0)} icon={ShoppingCart} isLoading={report.isLoading} />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(summary?.transaction_count ? Number(summary.total) / summary.transaction_count : 0, currency)}
          icon={ReceiptIcon}
          isLoading={report.isLoading}
        />
        <StatCard label="Discount" value={formatCurrency(summary?.discount ?? 0, currency)} icon={Percent} isLoading={report.isLoading} />
        <StatCard label="Tax" value={formatCurrency(summary?.tax ?? 0, currency)} icon={Percent} isLoading={report.isLoading} />
        <StatCard label="Net Sales" value={formatCurrency(summary?.subtotal ?? 0, currency)} icon={DollarSign} isLoading={report.isLoading} />
      </div>
      <DataTable
        columns={columns}
        rows={report.data?.sales.data ?? []}
        isLoading={report.isLoading}
        meta={report.data?.sales.meta}
        onPageChange={setPage}
        emptyTitle="No sales in this period"
      />
    </div>
  );
}

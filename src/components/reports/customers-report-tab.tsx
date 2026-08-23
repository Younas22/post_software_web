"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomersReport } from "@/hooks/use-reports";
import { useDateRangePreset } from "@/hooks/use-date-range-preset";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { ReportFiltersBar } from "./report-filters-bar";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { CustomerSpendRow } from "@/services/reports.service";

export function CustomersReportTab({ currency }: { currency: string }) {
  const { preset, setPreset, customRange, setCustomRange, range } = useDateRangePreset("30d");
  const { branchId: activeBranchId } = useActiveBranch();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const report = useCustomersReport({ ...range, branch_id: branchId ? Number(branchId) : undefined, page, per_page: 15 }, !!activeBranchId);

  const columns: DataTableColumn<CustomerSpendRow>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (r) => (
        <Link href={`/customers/${r.customer_id}`} className="font-medium text-foreground hover:text-brand hover:underline">
          {r.customer?.name ?? `#${r.customer_id}`}
        </Link>
      ),
    },
    { key: "orders", header: "Orders", render: (r) => formatNumber(r.transaction_count) },
    { key: "spent", header: "Total Spent", render: (r) => formatCurrency(r.total_spent, currency) },
  ];

  return (
    <div className="space-y-4">
      <ReportFiltersBar preset={preset} onPresetChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} branchId={branchId} onBranchChange={setBranchId} />
      <DataTable
        columns={columns}
        rows={report.data?.customers.data ?? []}
        isLoading={report.isLoading}
        meta={report.data?.customers.meta}
        onPageChange={setPage}
        getRowKey={(r) => r.customer_id}
        emptyTitle="No customer purchases in this period"
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { DollarSign, Receipt as ReceiptIcon } from "lucide-react";
import { useExpensesReport } from "@/hooks/use-reports";
import { useDateRangePreset } from "@/hooks/use-date-range-preset";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { ReportFiltersBar } from "./report-filters-bar";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

export function ExpensesReportTab({ currency }: { currency: string }) {
  const { preset, setPreset, customRange, setCustomRange, range } = useDateRangePreset("7d");
  const { branchId: activeBranchId } = useActiveBranch();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const report = useExpensesReport({ ...range, branch_id: branchId ? Number(branchId) : undefined, page, per_page: 10 }, !!activeBranchId);
  const summary = report.data?.summary;
  const byCategory = report.data?.by_category ?? [];
  const maxCategoryTotal = Math.max(1, ...byCategory.map((c) => Number(c.total)));

  const columns: DataTableColumn<Expense>[] = [
    { key: "title", header: "Title", render: (e) => <span className="font-medium text-foreground">{e.title}</span> },
    { key: "category", header: "Category", render: (e) => e.category },
    { key: "branch", header: "Branch", render: (e) => e.branch?.name ?? "—" },
    { key: "amount", header: "Amount", render: (e) => formatCurrency(e.amount, currency) },
    { key: "date", header: "Date", render: (e) => formatDate(e.expense_date) },
  ];

  return (
    <div className="space-y-4">
      <ReportFiltersBar preset={preset} onPresetChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} branchId={branchId} onBranchChange={setBranchId} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Expenses" value={formatCurrency(summary?.total ?? 0, currency)} icon={DollarSign} tone="brand" isLoading={report.isLoading} />
        <StatCard label="Entries" value={String(summary?.expense_count ?? 0)} icon={ReceiptIcon} isLoading={report.isLoading} />
      </div>

      {byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byCategory.map((c) => (
              <div key={c.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{c.category}</span>
                  <span className="font-medium text-foreground">{formatCurrency(c.total, currency)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(Number(c.total) / maxCategoryTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} rows={report.data?.expenses.data ?? []} isLoading={report.isLoading} meta={report.data?.expenses.meta} onPageChange={setPage} emptyTitle="No expenses in this period" />
    </div>
  );
}

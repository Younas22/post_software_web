"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useReturns } from "@/hooks/use-returns";
import { FilterBar, FilterSelect } from "@/components/ui/filter";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SaleReturn } from "@/types";

export default function ReturnsPage() {
  const { config } = useAuth();
  const router = useRouter();
  const { branches, isPinned } = useActiveBranch();
  const currency = config?.business?.currency ?? "USD";

  const [branchId, setBranchId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const returns = useReturns({ branch_id: branchId ? Number(branchId) : undefined, page, per_page: 15 });

  const columns: DataTableColumn<SaleReturn>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (r) => <span className="font-medium text-foreground">{r.reference}</span>,
    },
    {
      key: "sale",
      header: "Original Invoice",
      render: (r) =>
        r.sale ? (
          <Link href={`/sales/${r.sale.id}`} className="text-brand hover:underline">
            {r.sale.invoice_number}
          </Link>
        ) : (
          "—"
        ),
    },
    { key: "reason", header: "Reason", render: (r) => <span className="text-muted-foreground">{r.reason ?? "—"}</span> },
    { key: "refund", header: "Refund Amount", render: (r) => formatCurrency(r.refund_amount, currency) },
    { key: "date", header: "Date", render: (r) => formatDate(r.created_at) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Returns</h1>
        <p className="mt-1 text-sm text-muted-foreground">Items returned against past sales.</p>
      </div>

      {!isPinned && branches.length > 1 && (
        <FilterBar activeCount={branchId ? 1 : 0} onClear={() => setBranchId(undefined)}>
          <FilterSelect
            label="Branch"
            placeholder="All branches"
            value={branchId}
            onChange={(v) => { setBranchId(v); setPage(1); }}
            options={branches.map((b) => ({ label: b.name, value: String(b.id) }))}
          />
        </FilterBar>
      )}

      <DataTable
        columns={columns}
        rows={returns.data?.data ?? []}
        isLoading={returns.isLoading}
        meta={returns.data?.meta}
        onPageChange={setPage}
        onRowClick={(r) => router.push(`/returns/${r.id}`)}
        emptyIcon={Undo2}
        emptyTitle="No returns yet"
        emptyDescription="Returns processed from a sale's detail page will appear here."
      />
    </div>
  );
}

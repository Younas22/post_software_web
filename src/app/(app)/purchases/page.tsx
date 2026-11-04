"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { usePurchases } from "@/hooks/use-purchases";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { Button } from "@/components/ui/button";
import { FilterBar, FilterSelect } from "@/components/ui/filter";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Purchase } from "@/types";
import { useTerms } from "@/hooks/use-branding";

export default function PurchasesPage() {
  const terms = useTerms();
  const { hasPermission, config } = useAuth();
  const router = useRouter();
  const { branches, isPinned } = useActiveBranch();
  const currency = config?.business?.currency ?? "USD";

  const [status, setStatus] = useState<string | undefined>();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const purchases = usePurchases({ status, branch_id: branchId ? Number(branchId) : undefined, page, per_page: 15 });
  const canCreate = hasPermission("purchases.create");

  const columns: DataTableColumn<Purchase>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (p) => (
        <Link href={`/purchases/${p.id}`} className="font-medium text-foreground hover:text-brand hover:underline">
          {p.invoice_reference ?? `#${p.id}`}
        </Link>
      ),
    },
    { key: "supplier", header: terms.supplier, render: (p) => p.supplier?.name ?? "—" },
    { key: "branch", header: "Branch", render: (p) => p.branch?.name ?? "—" },
    { key: "total", header: "Total", render: (p) => formatCurrency(p.total, currency) },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "date", header: "Date", render: (p) => formatDate(p.purchase_date) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{terms.purchases}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track stock coming in from your {terms.suppliers.toLowerCase()}.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/purchases/new">
              <Plus /> New {terms.purchase}
            </Link>
          </Button>
        )}
      </div>

      <FilterBar activeCount={(status ? 1 : 0) + (branchId ? 1 : 0)} onClear={() => { setStatus(undefined); setBranchId(undefined); }}>
        <FilterSelect
          label="Status"
          placeholder="All statuses"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { label: "Pending", value: "pending" },
            { label: "Received", value: "received" },
            { label: "Cancelled", value: "cancelled" },
          ]}
        />
        {!isPinned && branches.length > 1 && (
          <FilterSelect
            label="Branch"
            placeholder="All branches"
            value={branchId}
            onChange={(v) => { setBranchId(v); setPage(1); }}
            options={branches.map((b) => ({ label: b.name, value: String(b.id) }))}
          />
        )}
      </FilterBar>

      <DataTable
        columns={columns}
        rows={purchases.data?.data ?? []}
        isLoading={purchases.isLoading}
        meta={purchases.data?.meta}
        onPageChange={setPage}
        onRowClick={(p) => router.push(`/purchases/${p.id}`)}
        emptyIcon={ShoppingBag}
        emptyTitle={`No ${terms.purchases.toLowerCase()} yet`}
        emptyDescription={`Record a ${terms.purchase.toLowerCase()} to start tracking incoming stock.`}
        emptyAction={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/purchases/new">
                <Plus /> New {terms.purchase}
              </Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

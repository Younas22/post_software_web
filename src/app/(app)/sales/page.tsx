"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useSales } from "@/hooks/use-sales";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { FilterBar, FilterSelect } from "@/components/ui/filter";
import { DateRangePicker, type DateRange } from "@/components/ui/date-picker";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Sale } from "@/types";
import { useTerms } from "@/hooks/use-branding";

export default function SalesHistoryPage() {
  const terms = useTerms();
  const { config } = useAuth();
  const router = useRouter();
  const { branches, isPinned } = useActiveBranch();
  const paymentMethods = usePaymentMethods();
  const currency = config?.business?.currency ?? "USD";

  const [branchId, setBranchId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>();
  const [range, setRange] = useState<DateRange>({});
  const [page, setPage] = useState(1);

  const sales = useSales({
    branch_id: branchId ? Number(branchId) : undefined,
    status,
    payment_method_id: paymentMethodId ? Number(paymentMethodId) : undefined,
    date_from: range.from ? range.from.toISOString().slice(0, 10) : undefined,
    date_to: range.to ? range.to.toISOString().slice(0, 10) : undefined,
    page,
    per_page: 15,
  });

  const activeCount = [branchId, status, paymentMethodId, range.from].filter(Boolean).length;

  const columns: DataTableColumn<Sale>[] = [
    { key: "invoice", header: "Invoice", render: (s) => <span className="font-medium text-foreground">{s.invoice_number}</span> },
    { key: "customer", header: terms.customer, render: (s) => s.customer?.name ?? "Walk-in" },
    { key: "cashier", header: "Cashier", render: (s) => s.user?.name ?? "—" },
    { key: "branch", header: "Branch", render: (s) => s.branch?.name ?? "—" },
    { key: "total", header: "Amount", render: (s) => formatCurrency(s.total, currency) },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
    { key: "date", header: "Date", render: (s) => formatDateTime(s.sale_date) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{terms.sales === `${terms.sales}` ? `${terms.sales} History` : terms.sales}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every completed transaction across your business.</p>
      </div>

      <FilterBar
        activeCount={activeCount}
        onClear={() => { setBranchId(undefined); setStatus(undefined); setPaymentMethodId(undefined); setRange({}); }}
      >
        <DateRangePicker value={range} onChange={(r) => { setRange(r); setPage(1); }} />
        {!isPinned && branches.length > 1 && (
          <FilterSelect
            label="Branch"
            placeholder="All branches"
            value={branchId}
            onChange={(v) => { setBranchId(v); setPage(1); }}
            options={branches.map((b) => ({ label: b.name, value: String(b.id) }))}
          />
        )}
        <FilterSelect
          label="Payment method"
          placeholder="All payment methods"
          value={paymentMethodId}
          onChange={(v) => { setPaymentMethodId(v); setPage(1); }}
          options={(paymentMethods.data ?? []).map((m) => ({ label: m.name, value: String(m.id) }))}
        />
        <FilterSelect
          label="Status"
          placeholder="All statuses"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={[{ label: "Completed", value: "completed" }, { label: "Void", value: "void" }]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={sales.data?.data ?? []}
        isLoading={sales.isLoading}
        meta={sales.data?.meta}
        onPageChange={setPage}
        onRowClick={(s) => router.push(`/sales/${s.id}`)}
        emptyIcon={ReceiptText}
        emptyTitle={`No ${terms.sales.toLowerCase()} found`}
        emptyDescription={activeCount > 0 ? "Try adjusting your filters." : `${terms.sales} made through ${terms.pos} will appear here.`}
      />
    </div>
  );
}

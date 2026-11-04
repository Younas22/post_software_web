"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, HandCoins, Plus, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useInstallments, useInstallmentSummary } from "@/hooks/use-installments";
import { useTerms } from "@/hooks/use-branding";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/ui/search";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { InstallmentsGate, InstallmentStatusBadge, ProgressBar, relativeDue, daysFromToday } from "@/components/installments/installment-ui";
import type { InstallmentPlan } from "@/types";

const TABS = [
  { value: "", label: "All plans" },
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function InstallmentsPage() {
  return (
    <InstallmentsGate>
      <InstallmentPlansList />
    </InstallmentsGate>
  );
}

function InstallmentPlansList() {
  const { config, hasPermission } = useAuth();
  const terms = useTerms();
  const router = useRouter();
  const { branchId } = useActiveBranch();
  const currency = config?.business?.currency ?? "USD";
  const money = (v: number | string) => formatCurrency(v, currency);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const plans = useInstallments({ status: status || undefined, search: search || undefined, page, per_page: 15, branch_id: branchId ?? undefined });
  const summary = useInstallmentSummary(branchId);
  const s = summary.data;

  const columns: DataTableColumn<InstallmentPlan>[] = [
    {
      key: "plan",
      header: "Plan",
      render: (p) => (
        <div>
          <Link href={`/installments/${p.id}`} className="font-semibold text-foreground hover:text-brand" onClick={(e) => e.stopPropagation()}>
            {p.plan_number}
          </Link>
          <p className="text-xs text-muted-foreground">{formatDate(p.start_date)}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: terms.customer,
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{p.customer?.name ?? "—"}</p>
          {p.customer?.phone && <p className="text-xs text-muted-foreground">{p.customer.phone}</p>}
        </div>
      ),
    },
    { key: "total", header: "Total", className: "whitespace-nowrap", render: (p) => <span className="font-medium">{money(p.total_amount)}</span> },
    {
      key: "progress",
      header: "Paid",
      className: "min-w-40",
      render: (p) => (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{money(p.paid_amount)}</span>
            <span className="font-semibold text-foreground">{p.progress}%</span>
          </div>
          <ProgressBar value={p.progress} tone={p.status === "completed" ? "success" : Number(p.overdue_amount ?? 0) > 0 ? "error" : "brand"} />
        </div>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      className: "whitespace-nowrap",
      render: (p) => <span className={cn("font-semibold", Number(p.balance) > 0 ? "text-foreground" : "text-muted-foreground")}>{money(p.balance)}</span>,
    },
    {
      key: "next",
      header: "Next due",
      className: "whitespace-nowrap",
      render: (p) => {
        if (p.status !== "active" || !p.next_due_date) return <span className="text-muted-foreground">—</span>;
        const late = daysFromToday(p.next_due_date) < 0;
        return (
          <div>
            <p className="font-medium text-foreground">{formatDate(p.next_due_date)}</p>
            <p className={cn("text-xs", late ? "font-medium text-error" : "text-muted-foreground")}>{relativeDue(p.next_due_date)}</p>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <InstallmentStatusBadge status={p.status === "active" && Number(p.overdue_amount ?? 0) > 0 ? "overdue_plan" : p.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Installment Plans</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every {terms.product.toLowerCase()} sold on installments, with what&apos;s paid and what&apos;s due.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/collections">
              <HandCoins /> Collections
            </Link>
          </Button>
          {hasPermission("installments.create") && (
            <Button asChild>
              <Link href="/installments/new">
                <Plus /> New plan
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Active plans" value={formatNumber(s?.active_count ?? 0)} icon={CalendarClock} tone="brand" isLoading={summary.isLoading} hint={s ? `${s.completed_count} completed` : undefined} />
        <StatCard label="Outstanding" value={money(s?.outstanding ?? 0)} icon={Wallet} isLoading={summary.isLoading} hint="Still to be collected" />
        <StatCard
          label="Overdue"
          value={money(s?.overdue_amount ?? 0)}
          icon={AlertTriangle}
          tone={s && Number(s.overdue_amount) > 0 ? "error" : "default"}
          isLoading={summary.isLoading}
          hint={s ? `${s.overdue_plans} plan${s.overdue_plans === 1 ? "" : "s"} late` : undefined}
        />
        <StatCard label="Collected this month" value={money(s?.collected_this_month ?? 0)} icon={HandCoins} tone="success" isLoading={summary.isLoading} hint={s ? `${money(s.collected_today)} today` : undefined} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={cn(
                "h-10 shrink-0 rounded-xl px-4 text-sm font-medium transition-colors",
                status === tab.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Search
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder={`Search plan no., ${terms.customer.toLowerCase()} or phone…`}
          className="lg:w-80"
        />
      </div>

      <DataTable
        columns={columns}
        rows={plans.data?.data ?? []}
        isLoading={plans.isLoading}
        meta={plans.data?.meta}
        onPageChange={setPage}
        onRowClick={(p) => router.push(`/installments/${p.id}`)}
        emptyIcon={CalendarClock}
        emptyTitle={status ? "No plans in this view" : "No installment plans yet"}
        emptyDescription={status ? "Try another tab or search." : `Create a plan when a ${terms.customer.toLowerCase()} buys on installments.`}
        emptyAction={
          !status && hasPermission("installments.create") ? (
            <Button asChild size="sm">
              <Link href="/installments/new">
                <Plus /> New plan
              </Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

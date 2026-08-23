"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Receipt, Pencil, Trash2, MoreVertical } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useExpenses, useExpenseMutations } from "@/hooks/use-expenses";
import { Button } from "@/components/ui/button";
import { FilterBar, FilterSelect } from "@/components/ui/filter";
import { DateRangePicker, type DateRange } from "@/components/ui/date-picker";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { IconButton } from "@/components/ui/icon-button";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

export default function ExpensesPage() {
  const { hasPermission, config } = useAuth();
  const { branches, isPinned } = useActiveBranch();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const currency = config?.business?.currency ?? "USD";

  const [branchId, setBranchId] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [range, setRange] = useState<DateRange>({});
  const [page, setPage] = useState(1);

  const expenses = useExpenses({
    branch_id: branchId ? Number(branchId) : undefined,
    category,
    date_from: range.from ? range.from.toISOString().slice(0, 10) : undefined,
    date_to: range.to ? range.to.toISOString().slice(0, 10) : undefined,
    page,
    per_page: 15,
  });
  const mutations = useExpenseMutations();

  const canCreate = hasPermission("expenses.create");
  const canUpdate = hasPermission("expenses.update");
  const canDelete = hasPermission("expenses.delete");

  const handleDelete = async (expense: Expense) => {
    const ok = await confirm({ title: `Delete "${expense.title}"?`, description: "This can't be undone.", confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await mutations.remove.mutateAsync(expense.id);
      toast({ title: "Expense deleted", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't delete expense", description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
    }
  };

  const columns: DataTableColumn<Expense>[] = [
    {
      key: "title",
      header: "Title",
      render: (e) => (
        <Link href={`/expenses/${e.id}`} className="font-medium text-foreground hover:text-brand hover:underline">
          {e.title}
        </Link>
      ),
    },
    { key: "category", header: "Category", render: (e) => e.category },
    { key: "branch", header: "Branch", render: (e) => e.branch?.name ?? "—" },
    { key: "amount", header: "Amount", render: (e) => formatCurrency(e.amount, currency) },
    { key: "date", header: "Date", render: (e) => formatDate(e.expense_date) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (e) =>
        (canUpdate || canDelete) && (
          <Dropdown>
            <DropdownTrigger asChild>
              <IconButton aria-label={`Actions for ${e.title}`} variant="ghost" size="sm" onClick={(ev) => ev.stopPropagation()}>
                <MoreVertical />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end">
              {canUpdate && (
                <DropdownItem onSelect={() => router.push(`/expenses/${e.id}/edit`)}>
                  <Pencil className="size-4" /> Edit
                </DropdownItem>
              )}
              {canDelete && (
                <DropdownItem destructive onSelect={() => handleDelete(e)}>
                  <Trash2 className="size-4" /> Delete
                </DropdownItem>
              )}
            </DropdownContent>
          </Dropdown>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track operating costs across your business.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/expenses/new">
              <Plus /> New Expense
            </Link>
          </Button>
        )}
      </div>

      <FilterBar activeCount={(branchId ? 1 : 0) + (category ? 1 : 0) + (range.from ? 1 : 0)} onClear={() => { setBranchId(undefined); setCategory(undefined); setRange({}); }}>
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
          label="Category"
          placeholder="All categories"
          value={category}
          onChange={(v) => { setCategory(v); setPage(1); }}
          options={["Rent", "Utilities", "Salaries", "Supplies", "Maintenance", "Marketing", "Transport", "Other"].map((c) => ({ label: c, value: c }))}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={expenses.data?.data ?? []}
        isLoading={expenses.isLoading}
        meta={expenses.data?.meta}
        onPageChange={setPage}
        onRowClick={(e) => router.push(`/expenses/${e.id}`)}
        emptyIcon={Receipt}
        emptyTitle="No expenses recorded"
        emptyDescription="Log your first expense to start tracking costs."
        emptyAction={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/expenses/new">
                <Plus /> New Expense
              </Link>
            </Button>
          ) : undefined
        }
      />
      {dialog}
    </div>
  );
}

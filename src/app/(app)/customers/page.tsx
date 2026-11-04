"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, Pencil, Trash2, MoreVertical, Mail, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCustomers, useCustomerMutations } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/ui/search";
import { FilterBar, FilterSelect } from "@/components/ui/filter";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api/client";
import type { Customer } from "@/types";
import { useTerms } from "@/hooks/use-branding";

export default function CustomersPage() {
  const terms = useTerms();
  const { hasPermission } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const customers = useCustomers({ search: search || undefined, status, page, per_page: 15 });
  const mutations = useCustomerMutations();

  const canCreate = hasPermission("customers.create");
  const canUpdate = hasPermission("customers.update");
  const canDelete = hasPermission("customers.delete");

  const handleDelete = async (customer: Customer) => {
    const ok = await confirm({
      title: `Delete "${customer.name}"?`,
      description: "This can't be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await mutations.remove.mutateAsync(customer.id);
      toast({ title: `${terms.customer} deleted`, variant: "success" });
    } catch (err) {
      toast({ title: `Couldn't delete ${terms.customer.toLowerCase()}`, description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
    }
  };

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: terms.customer,
      render: (c) => (
        <Link href={`/customers/${c.id}`} className="flex items-center gap-3 hover:text-brand">
          <Avatar name={c.name} size="sm" />
          <span className="font-medium text-foreground">{c.name}</span>
        </Link>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) => (
        <div className="space-y-0.5 text-muted-foreground">
          {c.phone && <div className="flex items-center gap-1.5"><Phone className="size-3.5" />{c.phone}</div>}
          {c.email && <div className="flex items-center gap-1.5"><Mail className="size-3.5" />{c.email}</div>}
          {!c.phone && !c.email && "—"}
        </div>
      ),
    },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) =>
        (canUpdate || canDelete) && (
          <Dropdown>
            <DropdownTrigger asChild>
              <IconButton aria-label={`Actions for ${c.name}`} variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                <MoreVertical />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end">
              {canUpdate && (
                <DropdownItem onSelect={() => router.push(`/customers/${c.id}/edit`)}>
                  <Pencil className="size-4" /> Edit
                </DropdownItem>
              )}
              {canDelete && (
                <DropdownItem destructive onSelect={() => handleDelete(c)}>
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
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{terms.customers}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your {terms.customer.toLowerCase()} relationships.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/customers/new">
              <Plus /> New {terms.customer}
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Search value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, phone, or email…" className="sm:max-w-xs" />
        <FilterBar activeCount={status ? 1 : 0} onClear={() => setStatus(undefined)}>
          <FilterSelect
            label="Status"
            placeholder="All statuses"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]}
          />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={customers.data?.data ?? []}
        isLoading={customers.isLoading}
        meta={customers.data?.meta}
        onPageChange={setPage}
        onRowClick={(c) => router.push(`/customers/${c.id}`)}
        emptyIcon={Users}
        emptyTitle={search || status ? `No ${terms.customers.toLowerCase()} match your filters` : `No ${terms.customers.toLowerCase()} yet`}
        emptyDescription={search || status ? "Try adjusting your search or filters." : `Add your first ${terms.customer.toLowerCase()} to get started.`}
        emptyAction={
          canCreate && !search && !status ? (
            <Button asChild size="sm">
              <Link href="/customers/new">
                <Plus /> New {terms.customer}
              </Link>
            </Button>
          ) : undefined
        }
      />
      {dialog}
    </div>
  );
}

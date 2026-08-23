"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Truck, Pencil, Trash2, MoreVertical, Mail, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useSuppliers, useSupplierMutations } from "@/hooks/use-suppliers";
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
import type { Supplier } from "@/types";

export default function SuppliersPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const suppliers = useSuppliers({ search: search || undefined, status, page, per_page: 15 });
  const mutations = useSupplierMutations();

  const canCreate = hasPermission("suppliers.create");
  const canUpdate = hasPermission("suppliers.update");
  const canDelete = hasPermission("suppliers.delete");

  const handleDelete = async (supplier: Supplier) => {
    const ok = await confirm({
      title: `Delete "${supplier.name}"?`,
      description: "This can't be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await mutations.remove.mutateAsync(supplier.id);
      toast({ title: "Supplier deleted", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't delete supplier", description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
    }
  };

  const columns: DataTableColumn<Supplier>[] = [
    {
      key: "name",
      header: "Supplier",
      render: (s) => (
        <Link href={`/suppliers/${s.id}`} className="flex items-center gap-3 hover:text-brand">
          <Avatar name={s.name} size="sm" />
          <span className="font-medium text-foreground">{s.name}</span>
        </Link>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (s) => (
        <div className="space-y-0.5 text-muted-foreground">
          {s.phone && <div className="flex items-center gap-1.5"><Phone className="size-3.5" />{s.phone}</div>}
          {s.email && <div className="flex items-center gap-1.5"><Mail className="size-3.5" />{s.email}</div>}
          {!s.phone && !s.email && "—"}
        </div>
      ),
    },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (s) =>
        (canUpdate || canDelete) && (
          <Dropdown>
            <DropdownTrigger asChild>
              <IconButton aria-label={`Actions for ${s.name}`} variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                <MoreVertical />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end">
              {canUpdate && (
                <DropdownItem onSelect={() => router.push(`/suppliers/${s.id}/edit`)}>
                  <Pencil className="size-4" /> Edit
                </DropdownItem>
              )}
              {canDelete && (
                <DropdownItem destructive onSelect={() => handleDelete(s)}>
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
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Suppliers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage the vendors you purchase from.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/suppliers/new">
              <Plus /> New Supplier
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
        rows={suppliers.data?.data ?? []}
        isLoading={suppliers.isLoading}
        meta={suppliers.data?.meta}
        onPageChange={setPage}
        onRowClick={(s) => router.push(`/suppliers/${s.id}`)}
        emptyIcon={Truck}
        emptyTitle={search || status ? "No suppliers match your filters" : "No suppliers yet"}
        emptyDescription={search || status ? "Try adjusting your search or filters." : "Add your first supplier to get started."}
        emptyAction={
          canCreate && !search && !status ? (
            <Button asChild size="sm">
              <Link href="/suppliers/new">
                <Plus /> New Supplier
              </Link>
            </Button>
          ) : undefined
        }
      />
      {dialog}
    </div>
  );
}

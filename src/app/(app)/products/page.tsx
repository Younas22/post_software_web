"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Package, Tags, Pencil, Trash2, MoreVertical } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useProducts, useProductMutations } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
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
import { ApiClientError, storageUrl } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { useTerms } from "@/hooks/use-branding";

export default function ProductsPage() {
  const terms = useTerms();
  const { hasPermission, config } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const categories = useCategories({ per_page: 100, status: "active" });
  const products = useProducts({
    search: search || undefined,
    category_id: categoryId ? Number(categoryId) : undefined,
    status,
    type,
    page,
    per_page: 15,
  });
  const mutations = useProductMutations();
  const currency = config?.business?.currency ?? "USD";

  const canCreate = hasPermission("products.create");
  const canUpdate = hasPermission("products.update");
  const canDelete = hasPermission("products.delete");

  const handleDelete = async (product: Product) => {
    const ok = await confirm({
      title: `Delete "${product.name}"?`,
      description: `This ${terms.product.toLowerCase()} will be removed from the catalog. This can't be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await mutations.remove.mutateAsync(product.id);
      toast({ title: `${terms.product} deleted`, variant: "success" });
    } catch (err) {
      toast({ title: `Couldn't delete ${terms.product.toLowerCase()}`, description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
    }
  };

  const activeFilters = [categoryId, status, type].filter(Boolean).length;

  const columns: DataTableColumn<Product>[] = [
    {
      key: "product",
      header: terms.product,
      render: (p) => (
        <Link href={`/products/${p.id}`} className="flex items-center gap-3 hover:text-brand">
          <Avatar name={p.name} src={storageUrl(p.image)} size="sm" />
          <span className="font-medium text-foreground hover:text-brand">{p.name}</span>
        </Link>
      ),
    },
    { key: "sku", header: "SKU", render: (p) => <span className="text-muted-foreground">{p.sku}</span> },
    {
      key: "type",
      header: "Type",
      render: (p) =>
        p.type === "service" ? (
          <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-info">Service</span>
        ) : (
          <span className="text-muted-foreground">{terms.product}</span>
        ),
    },
    { key: "barcode", header: "Barcode", render: (p) => <span className="text-muted-foreground">{p.barcode ?? "—"}</span> },
    { key: "category", header: "Category", render: (p) => p.category?.name ?? "—" },
    { key: "price", header: "Price", render: (p) => formatCurrency(p.sale_price, currency) },
    // A service has no inventory row (see Product.isService() / SaleService), so
    // "0" here would misleadingly read as out-of-stock rather than not-applicable.
    { key: "stock", header: "Stock", render: (p) => (p.type === "service" ? "—" : (p.stock ?? 0)) },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) =>
        (canUpdate || canDelete) && (
          <Dropdown>
            <DropdownTrigger asChild>
              <IconButton aria-label={`Actions for ${p.name}`} variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                <MoreVertical />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end">
              {canUpdate && (
                <DropdownItem onSelect={() => router.push(`/products/${p.id}/edit`)}>
                  <Pencil className="size-4" /> Edit
                </DropdownItem>
              )}
              {canDelete && (
                <DropdownItem destructive onSelect={() => handleDelete(p)}>
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
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{terms.products}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your {terms.product.toLowerCase()} catalog.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/products/categories">
              <Tags /> Categories
            </Link>
          </Button>
          {canCreate && (
            <Button asChild>
              <Link href="/products/new">
                <Plus /> New {terms.product}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Search value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, SKU, or barcode…" className="sm:max-w-xs" />
        <FilterBar activeCount={activeFilters} onClear={() => { setCategoryId(undefined); setStatus(undefined); setType(undefined); setPage(1); }}>
          <FilterSelect
            label="Type"
            placeholder={`${terms.products} & services`}
            value={type}
            onChange={(v) => { setType(v); setPage(1); }}
            options={[
              { label: terms.product, value: "product" },
              { label: "Service", value: "service" },
            ]}
          />
          <FilterSelect
            label="Category"
            placeholder="All categories"
            value={categoryId}
            onChange={(v) => { setCategoryId(v); setPage(1); }}
            options={(categories.data?.data ?? []).map((c) => ({ label: c.name, value: String(c.id) }))}
          />
          <FilterSelect
            label="Status"
            placeholder="All statuses"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={products.data?.data ?? []}
        isLoading={products.isLoading}
        meta={products.data?.meta}
        onPageChange={setPage}
        onRowClick={(p) => router.push(`/products/${p.id}`)}
        emptyIcon={Package}
        emptyTitle={search || categoryId || status || type ? `No ${terms.products.toLowerCase()} match your filters` : `No ${terms.products.toLowerCase()} yet`}
        emptyDescription={search || categoryId || status || type ? "Try adjusting your search or filters." : `Add your first ${terms.product.toLowerCase()} to start selling.`}
        emptyAction={
          canCreate && !search && !categoryId && !status && !type ? (
            <Button asChild size="sm">
              <Link href="/products/new">
                <Plus /> New {terms.product}
              </Link>
            </Button>
          ) : undefined
        }
      />
      {dialog}
    </div>
  );
}

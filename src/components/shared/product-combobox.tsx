"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Package, Search } from "lucide-react";
import { productsService } from "@/services/products.service";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

/** Searchable product picker — used by Stock Adjustment, Purchases, and POS. */
export function ProductCombobox({
  value,
  onSelect,
  currency = "USD",
  placeholder = "Search product by name, SKU, or barcode…",
  disabled,
}: {
  value?: Product | null;
  onSelect: (product: Product) => void;
  currency?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useQuery({
    queryKey: ["products", "combobox", query],
    queryFn: () => productsService.list({ search: query || undefined, status: "active", per_page: 20 }),
    enabled: open,
    placeholderData: (prev) => prev,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-[var(--input-background)] px-3 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value ? `${value.name} — ${value.sku}` : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {results.isLoading ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Searching…</p>
          ) : (results.data?.data.length ?? 0) === 0 ? (
            <p className="flex flex-col items-center gap-1 px-3 py-6 text-center text-sm text-muted-foreground">
              <Package className="size-5" /> No products found
            </p>
          ) : (
            results.data?.data.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onSelect(product);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{product.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {product.sku}
                    {product.stock !== undefined && product.stock !== null ? ` · ${product.stock} in stock` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{formatCurrency(product.sale_price, currency)}</span>
                  {value?.id === product.id && <Check className="size-4 text-brand" />}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

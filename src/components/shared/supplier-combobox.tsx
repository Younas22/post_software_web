"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Truck } from "lucide-react";
import { suppliersService } from "@/services/suppliers.service";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/types";

export function SupplierCombobox({
  value,
  onSelect,
  placeholder = "Select a supplier…",
  disabled,
}: {
  value?: Supplier | null;
  onSelect: (supplier: Supplier) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useQuery({
    queryKey: ["suppliers", "combobox", query],
    queryFn: () => suppliersService.list({ search: query || undefined, status: "active", per_page: 20 }),
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
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value ? value.name : placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="border-b border-border px-3 py-2">
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search suppliers…" className="h-8 border-0 px-0 shadow-none focus-visible:ring-0" />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {results.isLoading ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Searching…</p>
          ) : (results.data?.data.length ?? 0) === 0 ? (
            <p className="flex flex-col items-center gap-1 px-3 py-6 text-center text-sm text-muted-foreground">
              <Truck className="size-5" /> No suppliers found
            </p>
          ) : (
            results.data?.data.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                onClick={() => {
                  onSelect(supplier);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="truncate font-medium text-foreground">{supplier.name}</span>
                {value?.id === supplier.id && <Check className="size-4 shrink-0 text-brand" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

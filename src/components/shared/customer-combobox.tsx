"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, User, UserPlus } from "lucide-react";
import { customersService } from "@/services/customers.service";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types";

export function CustomerCombobox({
  value,
  onSelect,
  onCreateNew,
  placeholder = "Walk-in Customer",
}: {
  value?: Customer | null;
  onSelect: (customer: Customer | null) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useQuery({
    queryKey: ["customers", "combobox", query],
    queryFn: () => customersService.list({ search: query || undefined, status: "active", per_page: 20 }),
    enabled: open,
    placeholderData: (prev) => prev,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-[var(--input-background)] px-3 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <User className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{value ? value.name : placeholder}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="border-b border-border px-3 py-2">
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className="h-8 border-0 px-0 shadow-none focus-visible:ring-0" />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"
          >
            <span className="font-medium text-foreground">Walk-in Customer</span>
            {!value && <Check className="size-4 text-brand" />}
          </button>
          {onCreateNew && query && (
            <button
              type="button"
              onClick={() => {
                onCreateNew(query);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-brand hover:bg-muted"
            >
              <UserPlus className="size-4" /> Create &quot;{query}&quot;
            </button>
          )}
          {results.isLoading ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Searching…</p>
          ) : (
            results.data?.data.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  onSelect(customer);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{customer.name}</span>
                  {customer.phone && <span className="block truncate text-xs text-muted-foreground">{customer.phone}</span>}
                </span>
                {value?.id === customer.id && <Check className="size-4 shrink-0 text-brand" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

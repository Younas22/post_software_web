"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

/** A single labeled filter dropdown (status, category, branch, ...). */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
  className,
}: {
  label: string;
  value: string | undefined;
  options: FilterOption[];
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value ?? "__all"} onValueChange={(v) => onChange(v === "__all" ? undefined : v)}>
      <SelectTrigger className={cn("h-10 min-w-[9rem]", className)} aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{placeholder}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Bar wrapper: filter controls + an active-filter count + a clear action. */
export function FilterBar({
  children,
  activeCount,
  onClear,
  className,
}: {
  children: React.ReactNode;
  activeCount?: number;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
      {children}
      {!!activeCount && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5">
          Clear <Badge variant="brand">{activeCount}</Badge>
        </Button>
      )}
    </div>
  );
}

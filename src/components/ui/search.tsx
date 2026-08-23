"use client";

import { forwardRef, useEffect, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Called on Enter with the current raw (not-yet-debounced) value — e.g. for barcode-scanner "type + Enter" flows. */
  onEnter?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

/** Debounced search input — calls onChange only after the user pauses typing. */
export const Search = forwardRef<HTMLInputElement, SearchProps>(
  ({ value, onChange, onEnter, placeholder = "Search…", debounceMs = 350, className }, ref) => {
    const [local, setLocal] = useState(value);

    // Keeps the input in sync when the parent resets `value` externally (e.g.
    // a "Clear filters" action) without fighting the debounce below.
    useEffect(() => setLocal(value), [value]);

    useEffect(() => {
      if (local === value) return;
      const timer = setTimeout(() => onChange(local), debounceMs);
      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [local]);

    return (
      <div className={cn("relative", className)}>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter?.(local);
          }}
          placeholder={placeholder}
          className="pl-9 pr-9"
          aria-label={placeholder}
        />
        {local && (
          <button
            type="button"
            onClick={() => setLocal("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }
);
Search.displayName = "Search";

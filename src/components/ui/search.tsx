"use client";

import { useEffect, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

/** Debounced search input — calls onChange only after the user pauses typing. */
export function Search({
  value,
  onChange,
  placeholder = "Search…",
  debounceMs = 350,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}) {
  const [local, setLocal] = useState(value);

  // Keeps the input in sync when the parent resets `value` externally (e.g.
  // a "Clear filters" action) without fighting the debounce below.
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
        value={local}
        onChange={(e) => setLocal(e.target.value)}
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

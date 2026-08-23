"use client";

import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

export function CategoryRail({
  activeCategoryId,
  onSelect,
}: {
  activeCategoryId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const categories = useCategories({ per_page: 100, status: "active" });

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:px-2">
      <CategoryButton label="All" active={activeCategoryId === null} onClick={() => onSelect(null)} />
      {(categories.data?.data ?? []).map((c) => (
        <CategoryButton key={c.id} label={c.name} active={activeCategoryId === c.id} onClick={() => onSelect(c.id)} />
      ))}
    </div>
  );
}

function CategoryButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors lg:w-full lg:text-left",
        active ? "bg-brand text-brand-foreground" : "bg-muted text-foreground hover:bg-border/70"
      )}
    >
      {label}
    </button>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import type { PaginationMeta } from "@/lib/api/types";

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta | Record<string, never> | undefined;
  onPageChange: (page: number) => void;
}) {
  if (!meta || !("current_page" in meta) || meta.last_page <= 1) return null;

  const { current_page, last_page, total, from, to } = meta;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from ?? 0}</span>–
        <span className="font-medium text-foreground">{to ?? 0}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1}
        >
          <ChevronLeft /> Previous
        </Button>
        <span className="px-2 text-sm text-muted-foreground">
          Page {current_page} of {last_page}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page >= last_page}
        >
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

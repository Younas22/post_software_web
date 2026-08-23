"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";
import { TableSkeleton } from "./skeleton";
import { Card } from "./card";
import type { PaginationMeta } from "@/lib/api/types";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

/**
 * Standard list-page table: loading skeleton, empty state, pagination —
 * every module (Products, Customers, Suppliers, Purchases, ...) renders its
 * list through this so behavior/appearance never drifts between them.
 */
export function DataTable<T>({
  columns,
  rows,
  isLoading,
  meta,
  onPageChange,
  emptyIcon,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  onRowClick,
  getRowKey = (row: T) => (row as { id: number | string }).id,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  meta?: PaginationMeta | Record<string, never>;
  onPageChange?: (page: number) => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  /** Row key extractor — defaults to `row.id`; pass this for rows with no `id` (e.g. report aggregate rows keyed by product_id/customer_id). */
  getRowKey?: (row: T) => number | string;
}) {
  return (
    <Card className="overflow-hidden py-0">
      {isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : rows.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {onPageChange && meta && <Pagination meta={meta} onPageChange={onPageChange} />}
    </Card>
  );
}

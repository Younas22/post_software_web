"use client";

import { Package, Wrench } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { storageUrl } from "@/lib/api/client";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductGrid({
  products,
  isLoading,
  currency,
  onSelect,
}: {
  products: Product[];
  isLoading: boolean;
  currency: string;
  onSelect: (product: Product) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3]" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <EmptyState icon={Package} title="No products found" description="Try a different search term or category." className="py-20" />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const isService = product.type === "service";
        // A service never has an inventory row, so product.stock is always
        // null for one (Eloquent's withSum() with no matching rows) — never
        // treated as "out of stock", matching "services are non-inventory".
        const outOfStock = !isService && product.stock !== undefined && product.stock !== null && product.stock <= 0;
        return (
          <button
            key={product.id}
            type="button"
            disabled={outOfStock}
            onClick={() => onSelect(product)}
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-xs transition-all",
              "hover:border-brand/50 hover:shadow-sm active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              outOfStock && "opacity-50 grayscale"
            )}
          >
            <div className="relative flex aspect-[4/3] items-center justify-center bg-muted">
              {isService && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-semibold text-info">
                  Service
                </span>
              )}
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- backend-hosted product photo in a dense grid, not a static asset
                <img src={storageUrl(product.image)} alt="" className="size-full object-cover" />
              ) : isService ? (
                <Wrench className="size-8 text-muted-foreground" />
              ) : (
                <Package className="size-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-0.5 p-2.5">
              <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sku}</p>
              <div className="mt-auto flex items-center justify-between pt-1">
                <span className="text-sm font-semibold text-brand">{formatCurrency(product.sale_price, currency)}</span>
                {!isService && product.stock !== undefined && product.stock !== null && (
                  <span className={cn("text-xs", outOfStock ? "text-error" : "text-muted-foreground")}>
                    {outOfStock ? "Out of stock" : `${product.stock} left`}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { Minus, Plus, Trash2, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { EmptyState } from "@/components/ui/empty-state";
import { CustomerCombobox } from "@/components/shared/customer-combobox";
import { DiscountPopover } from "./discount-popover";
import {
  useCartStore,
  cartSubtotal,
  cartDiscount,
  cartTaxEstimate,
  cartTotal,
  lineTotal,
  type CartLine,
} from "@/store/cart-store";
import { formatCurrency, cn } from "@/lib/utils";

export function CartPanel({
  currency,
  onCheckout,
  onCreateCustomer,
  onClose,
  className,
}: {
  currency: string;
  onCheckout: () => void;
  onCreateCustomer: (name: string) => void;
  onClose?: () => void;
  className?: string;
}) {
  const { lines, customer, incrementQuantity, setQuantity, removeLine, applyDiscountToAll, setCustomer, clear } = useCartStore();

  const subtotal = cartSubtotal(lines);
  const discount = cartDiscount(lines);
  const tax = cartTaxEstimate(lines);
  const total = cartTotal(lines);

  return (
    <div className={cn("flex h-full flex-col bg-card", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShoppingCart className="size-4" /> Cart {lines.length > 0 && <span className="text-muted-foreground">({lines.length})</span>}
        </h2>
        <div className="flex items-center gap-1">
          {lines.length > 0 && (
            <>
              <DiscountPopover onApply={applyDiscountToAll} />
              <IconButton aria-label="Clear cart" variant="danger" size="sm" onClick={clear}>
                <Trash2 />
              </IconButton>
            </>
          )}
          {onClose && (
            <IconButton aria-label="Close cart" variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
              <X />
            </IconButton>
          )}
        </div>
      </div>

      <div className="border-b border-border p-3">
        <CustomerCombobox value={customer} onSelect={setCustomer} onCreateNew={onCreateCustomer} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Cart is empty" description="Tap a product to add it." className="py-16" />
        ) : (
          <ul className="divide-y divide-border">
            {lines.map((line) => (
              <CartLineRow key={line.product.id} line={line} currency={currency} onIncrement={incrementQuantity} onSetQuantity={setQuantity} onRemove={removeLine} />
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t border-border p-4">
        <Row label="Subtotal" value={formatCurrency(subtotal, currency)} />
        {discount > 0 && <Row label="Discount" value={`− ${formatCurrency(discount, currency)}`} />}
        {tax > 0 && <Row label="Tax (est.)" value={formatCurrency(tax, currency)} />}
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-semibold text-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">{formatCurrency(total, currency)}</span>
        </div>
        <Button className="mt-2 w-full" size="lg" disabled={lines.length === 0} onClick={onCheckout}>
          Charge {formatCurrency(total, currency)}
        </Button>
      </div>
    </div>
  );
}

function CartLineRow({
  line,
  currency,
  onIncrement,
  onSetQuantity,
  onRemove,
}: {
  line: CartLine;
  currency: string;
  onIncrement: (id: number, delta: number) => void;
  onSetQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <li className="flex items-start gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{line.product.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(line.product.sale_price, currency)}
          {line.discount > 0 && <span className="text-error"> · −{formatCurrency(line.discount, currency)}</span>}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <IconButton aria-label={`Decrease ${line.product.name}`} size="sm" onClick={() => onIncrement(line.product.id, -1)}>
            <Minus />
          </IconButton>
          <input
            type="number"
            aria-label={`Quantity for ${line.product.name}`}
            value={line.quantity}
            onChange={(e) => onSetQuantity(line.product.id, Number(e.target.value))}
            className="h-8 w-12 rounded-md border border-input bg-[var(--input-background)] text-center text-sm"
          />
          <IconButton aria-label={`Increase ${line.product.name}`} size="sm" onClick={() => onIncrement(line.product.id, 1)}>
            <Plus />
          </IconButton>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm font-semibold text-foreground">{formatCurrency(lineTotal(line), currency)}</span>
        <IconButton aria-label={`Remove ${line.product.name}`} variant="ghost" size="sm" onClick={() => onRemove(line.product.id)}>
          <Trash2 className="text-muted-foreground" />
        </IconButton>
      </div>
    </li>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

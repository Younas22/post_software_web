import { create } from "zustand";
import type { Customer, Product } from "@/types";

export interface CartLine {
  product: Product;
  quantity: number;
  /** Per-line discount amount, in the business's currency (matches the backend's items[].discount field). */
  discount: number;
}

interface CartState {
  lines: CartLine[];
  customer: Customer | null;
  addProduct: (product: Product) => void;
  removeLine: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  incrementQuantity: (productId: number, delta: number) => void;
  setLineDiscount: (productId: number, discount: number) => void;
  applyDiscountToAll: (type: "fixed" | "percent", value: number) => void;
  setCustomer: (customer: Customer | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()((set, get) => ({
  lines: [],
  customer: null,

  addProduct: (product) =>
    set((state) => {
      const existing = state.lines.find((l) => l.product.id === product.id);
      if (existing) {
        return {
          lines: state.lines.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l)),
        };
      }
      return { lines: [...state.lines, { product, quantity: 1, discount: 0 }] };
    }),

  removeLine: (productId) => set((state) => ({ lines: state.lines.filter((l) => l.product.id !== productId) })),

  setQuantity: (productId, quantity) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.product.id === productId ? { ...l, quantity: Math.max(1, Math.floor(quantity)) } : l))
        .filter((l) => l.quantity > 0),
    })),

  incrementQuantity: (productId, delta) => {
    const line = get().lines.find((l) => l.product.id === productId);
    if (!line) return;
    const next = line.quantity + delta;
    if (next <= 0) {
      get().removeLine(productId);
    } else {
      get().setQuantity(productId, next);
    }
  },

  setLineDiscount: (productId, discount) =>
    set((state) => ({
      lines: state.lines.map((l) => (l.product.id === productId ? { ...l, discount: Math.max(0, discount) } : l)),
    })),

  applyDiscountToAll: (type, value) =>
    set((state) => ({
      lines: state.lines.map((l) => {
        const lineSubtotal = l.quantity * Number(l.product.sale_price);
        const discount = type === "percent" ? round2((lineSubtotal * value) / 100) : Math.min(value, lineSubtotal);
        return { ...l, discount };
      }),
    })),

  setCustomer: (customer) => set({ customer }),

  clear: () => set({ lines: [], customer: null }),
}));

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// --- Derived totals (pure functions, used by components via selectors) ---

export function lineSubtotal(line: CartLine): number {
  return line.quantity * Number(line.product.sale_price);
}

export function lineTaxEstimate(line: CartLine): number {
  const rate = line.product.tax_rate ? Number(line.product.tax_rate) : 0;
  const gross = lineSubtotal(line) - line.discount;
  return rate ? round2((gross * rate) / 100) : 0;
}

export function lineTotal(line: CartLine): number {
  return round2(lineSubtotal(line) - line.discount + lineTaxEstimate(line));
}

export function cartSubtotal(lines: CartLine[]): number {
  return round2(lines.reduce((sum, l) => sum + lineSubtotal(l), 0));
}

export function cartDiscount(lines: CartLine[]): number {
  return round2(lines.reduce((sum, l) => sum + l.discount, 0));
}

export function cartTaxEstimate(lines: CartLine[]): number {
  return round2(lines.reduce((sum, l) => sum + lineTaxEstimate(l), 0));
}

export function cartTotal(lines: CartLine[]): number {
  return round2(cartSubtotal(lines) - cartDiscount(lines) + cartTaxEstimate(lines));
}

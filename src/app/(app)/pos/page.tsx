"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { usePosProducts } from "@/hooks/use-pos-products";
import { useCartStore, cartTotal } from "@/store/cart-store";
import { Search } from "@/components/ui/search";
import { Pagination } from "@/components/ui/pagination";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { CategoryRail } from "@/components/pos/category-rail";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { PaymentModal } from "@/components/pos/payment-modal";
import { SaleSuccess } from "@/components/pos/sale-success";
import { useToast } from "@/components/ui/toast";
import { customersService } from "@/services/customers.service";
import { salesService, type Receipt } from "@/services/sales.service";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import type { Product, PaymentMethod } from "@/types";

export default function PosPage() {
  const { config, hasFeature, hasPermission } = useAuth();
  const { toast } = useToast();
  const { branch, isLoading: branchLoading } = useActiveBranch();
  const currency = config?.business?.currency ?? "USD";

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const clientTransactionId = useRef(crypto.randomUUID());

  const { lines, customer, addProduct, setCustomer, clear } = useCartStore();
  const products = usePosProducts({ search, categoryId, page });

  // Keyboard shortcuts: F2 focus search, F4 open payment, Esc close overlays.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (lines.length > 0 && !receipt) setPaymentOpen(true);
      } else if (e.key === "Escape") {
        if (paymentOpen) setPaymentOpen(false);
        else if (cartOpen) setCartOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lines.length, receipt, paymentOpen, cartOpen]);

  const handleSelectProduct = (product: Product) => {
    addProduct(product);
    setSearch("");
  };

  const handleSearchEnter = () => {
    const results = products.data?.data ?? [];
    if (results.length === 1) {
      handleSelectProduct(results[0]);
    }
  };

  const handleCreateCustomer = async (name: string) => {
    try {
      const created = await customersService.create({ name, status: "active" });
      setCustomer(created);
      toast({ title: `Customer "${name}" created`, variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't create customer", description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
    }
  };

  const handleConfirmPayment = async (payment: { method: PaymentMethod; received?: number; reference?: string }) => {
    if (!branch) return;
    setIsSubmitting(true);
    setCheckoutError(null);
    try {
      const total = cartTotal(lines);
      const result = await salesService.create({
        branch_id: branch.id,
        customer_id: customer?.id ?? null,
        client_transaction_id: clientTransactionId.current,
        items: lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity, discount: l.discount || undefined })),
        payments: [{ payment_method_id: payment.method.id, amount: payment.received ?? total, reference: payment.reference }],
      });
      setReceipt(result);
      setPaymentOpen(false);
    } catch (err) {
      // Cart is deliberately NOT cleared on failure — the cashier can retry
      // (same client_transaction_id, so a retry after a network blip is safe).
      setCheckoutError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewSale = () => {
    clear();
    setReceipt(null);
    setCheckoutError(null);
    clientTransactionId.current = crypto.randomUUID();
    setPage(1);
  };

  if (!hasPermission("sales.create")) {
    return <EmptyState icon={ShoppingCart} title="POS access required" description="You don't have permission to create sales." className="py-24" />;
  }

  if (!hasFeature("pos")) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="POS is not enabled"
        description="The POS feature isn't enabled for your business plan. Contact your administrator."
        className="py-24"
      />
    );
  }

  if (!branchLoading && !branch) {
    return <EmptyState icon={Building2} title="No branch available" description="You need an active branch to use POS." className="py-24" />;
  }

  const total = cartTotal(lines);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:-m-6 lg:flex-row">
      <aside className="hidden shrink-0 border-r border-border lg:block lg:w-40">
        <CategoryRail activeCategoryId={categoryId} onSelect={(id) => { setCategoryId(id); setPage(1); }} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border p-4">
          <Search
            ref={searchInputRef}
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            onEnter={handleSearchEnter}
            placeholder="Search or scan barcode… (F2)"
          />
          <div className="mt-3 lg:hidden">
            <CategoryRail activeCategoryId={categoryId} onSelect={(id) => { setCategoryId(id); setPage(1); }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid products={products.data?.data ?? []} isLoading={products.isLoading} currency={currency} onSelect={handleSelectProduct} />
        </div>

        {products.data?.meta && "last_page" in products.data.meta && products.data.meta.last_page > 1 && (
          <Pagination meta={products.data.meta} onPageChange={setPage} />
        )}
      </div>

      <CartPanel
        currency={currency}
        onCheckout={() => setPaymentOpen(true)}
        onCreateCustomer={handleCreateCustomer}
        className="hidden w-96 shrink-0 border-l border-border lg:flex"
      />

      {/* Mobile: floating cart button + drawer */}
      {!cartOpen && lines.length > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-xl bg-brand px-5 py-3.5 text-brand-foreground shadow-lg lg:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="size-4" /> {lines.length} item{lines.length === 1 ? "" : "s"}
          </span>
          <span className="text-sm font-semibold">{formatCurrency(total, currency)}</span>
        </button>
      )}
      <Drawer open={cartOpen} onOpenChange={setCartOpen}>
        <DrawerContent side="right" size="md" className="lg:hidden">
          <CartPanel
            currency={currency}
            onCheckout={() => { setCartOpen(false); setPaymentOpen(true); }}
            onCreateCustomer={handleCreateCustomer}
            onClose={() => setCartOpen(false)}
            className="flex"
          />
        </DrawerContent>
      </Drawer>

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        currency={currency}
        isSubmitting={isSubmitting}
        error={checkoutError}
        onConfirm={handleConfirmPayment}
      />

      {receipt && <SaleSuccess receipt={receipt} currency={currency} onNewSale={handleNewSale} />}

      {checkoutError && !paymentOpen && (
        <div className="fixed inset-x-4 bottom-20 z-40 lg:inset-x-auto lg:right-[26rem] lg:bottom-4 lg:w-96">
          <Alert variant="error" title="Checkout failed">
            {checkoutError} Your cart has been kept — try again.
          </Alert>
        </div>
      )}
    </div>
  );
}

import { apiGet, apiGetList, apiPost } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { Sale } from "@/types";

export interface SaleItemPayload {
  product_id: number;
  quantity: number;
  /** Per-item only — there is no sale-level discount field in the backend (StoreSaleRequest). */
  discount?: number;
}

export interface SalePaymentPayload {
  payment_method_id: number;
  amount: number;
  reference?: string | null;
}

export interface CreateSalePayload {
  branch_id: number;
  customer_id?: number | null;
  items: SaleItemPayload[];
  payments: SalePaymentPayload[];
  client_transaction_id: string;
}

export interface Receipt {
  invoice_number: string;
  sale_date: string;
  status: string;
  business: { name: string; logo: string | null; phone: string | null; address: string | null };
  branch: { name: string; address: string | null; phone: string | null };
  cashier: { name: string };
  customer: { name: string; phone: string | null } | null;
  items: {
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax: number;
    line_total: number;
  }[];
  payments: { method: string; amount: number; reference: string | null }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export const salesService = {
  list: (params?: ListParams) => apiGetList<Sale>("/sales", { params }),
  get: (id: number) => apiGet<Sale>(`/sales/${id}`),
  /** POST /sales returns the built Receipt directly (see SaleController@store), not a raw Sale. */
  create: (payload: CreateSalePayload) => apiPost<Receipt>("/sales", payload),
  receipt: (id: number) => apiGet<Receipt>(`/sales/${id}/receipt`),
};

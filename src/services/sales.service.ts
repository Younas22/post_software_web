import { apiGet, apiGetList, apiPost } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { Sale } from "@/types";

export interface SaleItemPayload {
  product_id: number;
  quantity: number;
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
  discount?: number;
}

export interface Receipt {
  invoice_number: string;
  business: { name: string; logo: string | null; address: string | null; phone: string | null };
  branch: { name: string };
  cashier: { name: string };
  customer: { name: string } | null;
  items: { name: string; quantity: number; unit_price: number; discount: number; tax: number; line_total: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: { method: string; amount: number }[];
  date: string;
}

export const salesService = {
  list: (params?: ListParams) => apiGetList<Sale>("/sales", { params }),
  get: (id: number) => apiGet<Sale>(`/sales/${id}`),
  create: (payload: CreateSalePayload) => apiPost<Sale>("/sales", payload),
  receipt: (id: number) => apiGet<Receipt>(`/sales/${id}/receipt`),
};

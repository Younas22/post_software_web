import { apiGet, apiGetList, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { Purchase } from "@/types";

export interface PurchaseItemPayload {
  product_id: number;
  quantity: number;
  purchase_price: number;
  discount?: number;
  tax?: number;
}

export interface CreatePurchasePayload {
  branch_id: number;
  supplier_id: number;
  invoice_reference?: string | null;
  purchase_date: string;
  status?: "pending" | "received";
  notes?: string | null;
  items: PurchaseItemPayload[];
}

export interface UpdatePurchasePayload {
  invoice_reference?: string | null;
  purchase_date: string;
  notes?: string | null;
}

export const purchasesService = {
  list: (params?: ListParams) => apiGetList<Purchase>("/purchases", { params }),
  get: (id: number) => apiGet<Purchase>(`/purchases/${id}`),
  create: (payload: CreatePurchasePayload) => apiPost<Purchase>("/purchases", payload),
  update: (id: number, payload: UpdatePurchasePayload) => apiPut<Purchase>(`/purchases/${id}`, payload),
  receive: (id: number) => apiPatch<Purchase>(`/purchases/${id}/receive`),
  cancel: (id: number) => apiPatch<Purchase>(`/purchases/${id}/cancel`),
};

import { apiGet, apiGetList, apiPost } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { SaleReturn } from "@/types";

export interface ReturnItemPayload {
  sale_item_id: number;
  quantity: number;
}

export interface CreateReturnPayload {
  reason?: string | null;
  items: ReturnItemPayload[];
}

export const returnsService = {
  list: (params?: ListParams) => apiGetList<SaleReturn>("/returns", { params }),
  get: (id: number) => apiGet<SaleReturn>(`/returns/${id}`),
  createForSale: (saleId: number, payload: CreateReturnPayload) =>
    apiPost<SaleReturn>(`/sales/${saleId}/returns`, payload),
};

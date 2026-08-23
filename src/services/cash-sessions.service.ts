import { apiGet, apiGetList, apiPost } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { CashSession } from "@/types";

export const cashSessionsService = {
  list: (params?: ListParams) => apiGetList<CashSession>("/cash-sessions", { params }),
  current: (branchId: number) => apiGet<CashSession | null>("/cash-sessions/current", { params: { branch_id: branchId } }),
  open: (payload: { branch_id: number; opening_cash: number; notes?: string | null }) =>
    apiPost<CashSession>("/cash-sessions/open", payload),
  get: (id: number) => apiGet<CashSession>(`/cash-sessions/${id}`),
  cashIn: (id: number, payload: { amount: number; reason?: string | null }) =>
    apiPost<CashSession>(`/cash-sessions/${id}/cash-in`, payload),
  cashOut: (id: number, payload: { amount: number; reason?: string | null }) =>
    apiPost<CashSession>(`/cash-sessions/${id}/cash-out`, payload),
  close: (id: number, payload: { actual_cash: number; notes?: string | null }) =>
    apiPost<CashSession>(`/cash-sessions/${id}/close`, payload),
};

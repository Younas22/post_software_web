import { apiGet, apiGetList, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type { Branch } from "@/types";

export interface BranchPayload {
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  is_main?: boolean;
  status: "active" | "inactive";
}

export const branchesService = {
  list: (params?: { status?: string }) => apiGetList<Branch>("/branches", { params }).then((r) => r.data),
  get: (id: number) => apiGet<Branch>(`/branches/${id}`),
  create: (payload: BranchPayload) => apiPost<Branch>("/branches", payload),
  update: (id: number, payload: BranchPayload) => apiPut<Branch>(`/branches/${id}`, payload),
  activate: (id: number) => apiPatch<Branch>(`/branches/${id}/activate`),
  deactivate: (id: number) => apiPatch<Branch>(`/branches/${id}/deactivate`),
};

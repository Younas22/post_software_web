import { apiGet, apiGetList, apiPatch, apiPost } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { InstallmentFrequency, InstallmentPayment, InstallmentPlan, InstallmentSummary } from "@/types";
import type { InstallmentReceiptData } from "@/lib/installment-receipt-template";

export interface InstallmentPlanPayload {
  branch_id: number;
  customer_id: number;
  items: { product_id: number; quantity: number; unit_price?: number | null; serial_number?: string | null }[];
  markup_percent?: number;
  down_payment?: number;
  payment_method_id?: number | null;
  installments_count: number;
  frequency: InstallmentFrequency;
  start_date: string;
  first_due_date: string;
  customer_cnic?: string | null;
  recovery_officer_id?: number | null;
  guarantor_name?: string | null;
  guarantor_phone?: string | null;
  guarantor_cnic?: string | null;
  guarantor_address?: string | null;
  notes?: string | null;
}

export interface CollectPayload {
  amount: number;
  /** Authorized reduction of what is owed. */
  discount?: number;
  /** Late fee collected on top (never reduces the balance). */
  fine?: number;
  recovery_officer_id?: number | null;
  payment_method_id?: number | null;
  payment_date: string;
  reference?: string | null;
  notes?: string | null;
}

export const installmentsService = {
  list: (params?: ListParams) => apiGetList<InstallmentPlan>("/installments", { params }),
  summary: (params?: ListParams) => apiGet<InstallmentSummary>("/installments/summary", { params }),
  get: (id: number | string) => apiGet<InstallmentPlan>(`/installments/${id}`),
  create: (payload: InstallmentPlanPayload) => apiPost<InstallmentPlan>("/installments", payload),
  collect: (id: number, payload: CollectPayload) =>
    apiPost<{ payment: InstallmentPayment; plan: InstallmentPlan }>(`/installments/${id}/payments`, payload),
  cancel: (id: number) => apiPatch<InstallmentPlan>(`/installments/${id}/cancel`),
  /** Everything printed on one recovery receipt (print / reprint). */
  receipt: (planId: number, paymentId: number) => apiGet<InstallmentReceiptData>(`/installments/${planId}/payments/${paymentId}/receipt`),
};

import { apiGet, apiGetList, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { Employee } from "@/types";

export interface EmployeePayload {
  name: string;
  email: string;
  /** Required on create, optional (leave blank to keep current) on update. */
  password?: string;
  role: string;
  business_id?: number | null;
  branch_id?: number | null;
}

export const employeesService = {
  list: (params?: ListParams) => apiGetList<Employee>("/employees", { params }),
  get: (id: number) => apiGet<Employee>(`/employees/${id}`),
  create: (payload: EmployeePayload) => apiPost<Employee>("/employees", payload),
  update: (id: number, payload: Partial<EmployeePayload>) => apiPut<Employee>(`/employees/${id}`, payload),
  activate: (id: number) => apiPatch<Employee>(`/employees/${id}/activate`),
  deactivate: (id: number) => apiPatch<Employee>(`/employees/${id}/deactivate`),
};

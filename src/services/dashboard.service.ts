import { apiGet } from "@/lib/api/client";
import type { DashboardData } from "@/types";

export const dashboardService = {
  get: (params?: { branch_id?: number }) => apiGet<DashboardData>("/dashboard", { params }),
};

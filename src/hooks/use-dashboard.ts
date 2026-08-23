import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

export function useDashboard(branchId: number | null) {
  return useQuery({
    queryKey: ["dashboard", branchId],
    queryFn: () => dashboardService.get(branchId ? { branch_id: branchId } : undefined),
    enabled: branchId !== undefined,
    refetchInterval: 60_000,
  });
}

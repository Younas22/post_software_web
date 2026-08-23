import { useQuery } from "@tanstack/react-query";
import { branchesService } from "@/services/branches.service";

export function useBranches(enabled = true) {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesService.list({ status: "active" }),
    enabled,
    staleTime: 5 * 60_000,
  });
}

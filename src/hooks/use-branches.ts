import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { branchesService, type BranchPayload } from "@/services/branches.service";

export function useBranches(enabled = true) {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesService.list({ status: "active" }),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** All branches (active + inactive) — for the Branch management screen, where inactive ones must still be visible/reactivatable. */
export function useAllBranches() {
  return useQuery({
    queryKey: ["branches", "all"],
    queryFn: () => branchesService.list(),
  });
}

export function useBranchMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["branches"] });
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
  };

  return {
    create: useMutation({ mutationFn: (payload: BranchPayload) => branchesService.create(payload), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: BranchPayload }) => branchesService.update(id, payload),
      onSuccess: invalidate,
    }),
    activate: useMutation({ mutationFn: (id: number) => branchesService.activate(id), onSuccess: invalidate }),
    deactivate: useMutation({ mutationFn: (id: number) => branchesService.deactivate(id), onSuccess: invalidate }),
  };
}

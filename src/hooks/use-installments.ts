import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { installmentsService, type CollectPayload, type InstallmentPlanPayload } from "@/services/installments.service";
import type { ListParams } from "@/lib/api/types";

export function useInstallments(params?: ListParams) {
  return useQuery({
    queryKey: ["installments", "list", params],
    queryFn: () => installmentsService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useInstallmentSummary(branchId?: number | null, enabled = true) {
  return useQuery({
    queryKey: ["installments", "summary", branchId ?? null],
    queryFn: () => installmentsService.summary(branchId ? { branch_id: branchId } : undefined),
    enabled,
  });
}

export function useInstallment(id: number | undefined) {
  return useQuery({
    queryKey: ["installments", "detail", id],
    queryFn: () => installmentsService.get(id!),
    enabled: !!id,
  });
}

export function useInstallmentMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["installments"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  return {
    create: useMutation({ mutationFn: (payload: InstallmentPlanPayload) => installmentsService.create(payload), onSuccess: invalidate }),
    collect: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: CollectPayload }) => installmentsService.collect(id, payload),
      onSuccess: invalidate,
    }),
    cancel: useMutation({ mutationFn: (id: number) => installmentsService.cancel(id), onSuccess: invalidate }),
  };
}

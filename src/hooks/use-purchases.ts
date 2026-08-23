import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purchasesService, type CreatePurchasePayload, type UpdatePurchasePayload } from "@/services/purchases.service";
import type { ListParams } from "@/lib/api/types";

export function usePurchases(params?: ListParams) {
  return useQuery({
    queryKey: ["purchases", params],
    queryFn: () => purchasesService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function usePurchase(id: number | undefined) {
  return useQuery({
    queryKey: ["purchases", id],
    queryFn: () => purchasesService.get(id!),
    enabled: !!id,
  });
}

export function usePurchaseMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["purchases"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  return {
    create: useMutation({ mutationFn: (payload: CreatePurchasePayload) => purchasesService.create(payload), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: UpdatePurchasePayload }) => purchasesService.update(id, payload),
      onSuccess: invalidate,
    }),
    receive: useMutation({ mutationFn: (id: number) => purchasesService.receive(id), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: number) => purchasesService.cancel(id), onSuccess: invalidate }),
  };
}

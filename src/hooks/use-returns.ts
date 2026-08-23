import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { returnsService, type CreateReturnPayload } from "@/services/returns.service";
import type { ListParams } from "@/lib/api/types";

export function useReturns(params?: ListParams) {
  return useQuery({
    queryKey: ["returns", params],
    queryFn: () => returnsService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useReturn(id: number | undefined) {
  return useQuery({
    queryKey: ["returns", id],
    queryFn: () => returnsService.get(id!),
    enabled: !!id,
  });
}

/** Returns already processed against a given sale — used to compute remaining-returnable quantities. */
export function useReturnsForSale(saleId: number | undefined) {
  return useQuery({
    queryKey: ["returns", "for-sale", saleId],
    queryFn: () => returnsService.list({ sale_id: saleId!, per_page: 50 }),
    enabled: !!saleId,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ saleId, payload }: { saleId: number; payload: CreateReturnPayload }) => returnsService.createForSale(saleId, payload),
    onSuccess: (_, { saleId }) => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["sales", saleId] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

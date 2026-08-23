import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { suppliersService, type SupplierPayload } from "@/services/suppliers.service";
import type { ListParams } from "@/lib/api/types";

export function useSuppliers(params?: ListParams) {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => suppliersService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useSupplier(id: number | undefined) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => suppliersService.get(id!),
    enabled: !!id,
  });
}

export function useSupplierMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["suppliers"] });

  return {
    create: useMutation({ mutationFn: (payload: SupplierPayload) => suppliersService.create(payload), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: SupplierPayload }) => suppliersService.update(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => suppliersService.remove(id), onSuccess: invalidate }),
  };
}

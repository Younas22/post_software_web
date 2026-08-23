import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsService, type ProductPayload } from "@/services/products.service";
import type { ListParams } from "@/lib/api/types";

export function useProducts(params?: ListParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productsService.get(id!),
    enabled: !!id,
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const create = useMutation({
    mutationFn: (payload: ProductPayload) => productsService.create(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductPayload }) => productsService.update(id, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => productsService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

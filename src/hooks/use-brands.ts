import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { brandsService, type BrandPayload } from "@/services/brands.service";
import type { ListParams } from "@/lib/api/types";

export function useBrands(params?: ListParams) {
  return useQuery({
    queryKey: ["brands", params],
    queryFn: () => brandsService.list(params),
  });
}

export function useBrandMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["brands"] });

  const create = useMutation({
    mutationFn: (payload: BrandPayload) => brandsService.create(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BrandPayload }) => brandsService.update(id, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => brandsService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

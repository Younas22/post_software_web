import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesService, type CategoryPayload } from "@/services/categories.service";
import type { ListParams } from "@/lib/api/types";

export function useCategories(params?: ListParams) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoriesService.list(params),
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const create = useMutation({
    mutationFn: (payload: CategoryPayload) => categoriesService.create(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoryPayload }) => categoriesService.update(id, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => categoriesService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

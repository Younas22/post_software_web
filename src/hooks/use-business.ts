import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { businessService, type UpdateBusinessPayload } from "@/services/business.service";

export function useBusiness() {
  return useQuery({
    queryKey: ["business"],
    queryFn: () => businessService.get(),
  });
}

export function useBusinessMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["business"] });
    queryClient.invalidateQueries({ queryKey: ["config"] });
  };

  return {
    update: useMutation({ mutationFn: (payload: UpdateBusinessPayload) => businessService.update(payload), onSuccess: invalidate }),
    updateSettings: useMutation({
      mutationFn: (settings: Record<string, string | number | boolean | null>) => businessService.updateSettings(settings),
      onSuccess: invalidate,
    }),
  };
}

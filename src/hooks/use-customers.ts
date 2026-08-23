import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersService, type CustomerPayload } from "@/services/customers.service";
import type { ListParams } from "@/lib/api/types";

export function useCustomers(params?: ListParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customersService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(id: number | undefined) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customersService.get(id!),
    enabled: !!id,
  });
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customers"] });

  return {
    create: useMutation({ mutationFn: (payload: CustomerPayload) => customersService.create(payload), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: CustomerPayload }) => customersService.update(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => customersService.remove(id), onSuccess: invalidate }),
  };
}

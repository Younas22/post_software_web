import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesService, type EmployeePayload } from "@/services/employees.service";
import type { ListParams } from "@/lib/api/types";

export function useEmployees(params?: ListParams) {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => employeesService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useEmployee(id: number | undefined) {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: () => employeesService.get(id!),
    enabled: !!id,
  });
}

export function useEmployeeMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
  };

  return {
    create: useMutation({ mutationFn: (payload: EmployeePayload) => employeesService.create(payload), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<EmployeePayload> }) => employeesService.update(id, payload),
      onSuccess: invalidate,
    }),
    activate: useMutation({ mutationFn: (id: number) => employeesService.activate(id), onSuccess: invalidate }),
    deactivate: useMutation({ mutationFn: (id: number) => employeesService.deactivate(id), onSuccess: invalidate }),
  };
}

export const ASSIGNABLE_ROLES = [
  { value: "business-admin", label: "Business Admin" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
];

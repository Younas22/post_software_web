import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesService, type ExpensePayload } from "@/services/expenses.service";
import type { ListParams } from "@/lib/api/types";

export function useExpenses(params?: ListParams) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => expensesService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useExpense(id: number | undefined) {
  return useQuery({
    queryKey: ["expenses", id],
    queryFn: () => expensesService.get(id!),
    enabled: !!id,
  });
}

export function useExpenseMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return {
    create: useMutation({ mutationFn: (payload: ExpensePayload) => expensesService.create(payload), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Omit<ExpensePayload, "branch_id"> }) => expensesService.update(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => expensesService.remove(id), onSuccess: invalidate }),
  };
}

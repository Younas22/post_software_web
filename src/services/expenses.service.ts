import { createCrudService } from "@/lib/api/crud-factory";
import type { Expense } from "@/types";

export interface ExpensePayload {
  branch_id: number;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  notes?: string | null;
}

export const expensesService = createCrudService<Expense, ExpensePayload, Omit<ExpensePayload, "branch_id">>(
  "/expenses"
);

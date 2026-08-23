"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { LoadingState } from "@/components/ui/loading-state";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { useExpense, useExpenseMutations } from "@/hooks/use-expenses";

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const expenseId = Number(id);
  const router = useRouter();
  const { toast } = useToast();
  const { update } = useExpenseMutations();
  const { data: expense, isLoading } = useExpense(expenseId);

  if (isLoading || !expense) return <LoadingState label="Loading expense…" />;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Expenses", href: "/expenses" }, { label: expense.title, href: `/expenses/${expenseId}` }, { label: "Edit" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">Edit Expense</h1>
      </div>
      <ExpenseForm
        expense={expense}
        submitLabel="Save changes"
        isSubmitting={update.isPending}
        onSubmit={async ({ branch_id, ...rest }) => {
          void branch_id; // UpdateExpenseRequest doesn't accept branch_id — a purchase/expense's branch is fixed at creation
          await update.mutateAsync({ id: expenseId, payload: rest });
          toast({ title: "Expense updated", variant: "success" });
          router.push(`/expenses/${expenseId}`);
        }}
      />
    </div>
  );
}

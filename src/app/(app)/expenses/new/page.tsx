"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { useExpenseMutations } from "@/hooks/use-expenses";

export default function NewExpensePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { create } = useExpenseMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Expenses", href: "/expenses" }, { label: "New Expense" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New Expense</h1>
      </div>
      <ExpenseForm
        submitLabel="Create expense"
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const expense = await create.mutateAsync(payload);
          toast({ title: "Expense created", variant: "success" });
          router.push(`/expenses/${expense.id}`);
        }}
      />
    </div>
  );
}

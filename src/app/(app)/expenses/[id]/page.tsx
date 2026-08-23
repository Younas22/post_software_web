"use client";

import { use } from "react";
import Link from "next/link";
import { Pencil, Building2, Calendar, Tag, User, FileText } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { useExpense } from "@/hooks/use-expenses";
import { useAuth } from "@/lib/auth/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ExpenseViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const expenseId = Number(id);
  const { hasPermission, config } = useAuth();
  const { data: expense, isLoading } = useExpense(expenseId);
  const currency = config?.business?.currency ?? "USD";

  if (isLoading || !expense) return <LoadingState label="Loading expense…" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Expenses", href: "/expenses" }, { label: expense.title }]} />
          <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">{expense.title}</h1>
        </div>
        {hasPermission("expenses.update") && (
          <Button variant="outline" asChild>
            <Link href={`/expenses/${expenseId}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{formatCurrency(expense.amount, currency)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Tag className="size-4 text-muted-foreground" /> {expense.category}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="size-4 text-muted-foreground" /> {formatDate(expense.expense_date)}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Building2 className="size-4 text-muted-foreground" /> {expense.branch?.name ?? "—"}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <User className="size-4 text-muted-foreground" /> {expense.user?.name ?? "—"}
          </div>
          {expense.notes && (
            <div className="flex items-start gap-2 border-t border-border pt-3 text-foreground">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {expense.notes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

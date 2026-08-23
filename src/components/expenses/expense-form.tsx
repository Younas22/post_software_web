"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { ApiClientError } from "@/lib/api/client";
import type { Expense } from "@/types";
import type { ExpensePayload } from "@/services/expenses.service";

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Supplies", "Maintenance", "Marketing", "Transport", "Other"];

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  category: z.string().min(1, "Category is required"),
  amount: z.number({ error: "Amount is required" }).min(0.01, "Must be greater than 0"),
  expense_date: z.string().min(1, "Date is required"),
  branch_id: z.string().min(1, "Branch is required"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function ExpenseForm({
  expense,
  onSubmit,
  isSubmitting,
  submitLabel = "Save expense",
}: {
  expense?: Expense;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}) {
  const { branch, branches, isPinned } = useActiveBranch();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: expense?.title ?? "",
      category: expense?.category ?? "",
      amount: expense ? Number(expense.amount) : undefined,
      expense_date: expense?.expense_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      branch_id: expense?.branch_id ? String(expense.branch_id) : branch ? String(branch.id) : undefined,
      notes: expense?.notes ?? "",
    },
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adopts the async-resolved active branch as the default once the form's already-empty branch field hasn't been touched
    if (!expense && branch) setValue("branch_id", String(branch.id), { shouldDirty: false });
  }, [branch, expense, setValue]);

  const submit = async (values: FormValues) => {
    setServerError(null);
    try {
      await onSubmit({
        branch_id: Number(values.branch_id),
        title: values.title,
        category: values.category,
        amount: values.amount,
        expense_date: values.expense_date,
        notes: values.notes || null,
      });
    } catch (err) {
      if (err instanceof ApiClientError && Object.keys(err.errors).length > 0) {
        Object.entries(err.errors).forEach(([field, messages]) => {
          if (["title", "category", "amount", "expense_date", "branch_id", "notes"].includes(field)) {
            setError(field as keyof FormValues, { message: messages[0] });
          }
        });
        setServerError("Please fix the errors below.");
      } else {
        setServerError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required error={errors.title?.message} className="sm:col-span-2">
            <Input {...register("title")} error={!!errors.title} autoFocus />
          </Field>
          <Field label="Category" required error={errors.category?.message}>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Category" error={!!errors.category}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Amount" required error={errors.amount?.message}>
            <Input type="number" min="0" step="0.01" {...register("amount", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })} error={!!errors.amount} />
          </Field>
          <Field label="Date" required error={errors.expense_date?.message}>
            <Input type="date" {...register("expense_date")} error={!!errors.expense_date} />
          </Field>
          <Field label="Branch" required error={errors.branch_id?.message}>
            <Controller
              control={control}
              name="branch_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isPinned}>
                  <SelectTrigger aria-label="Branch" error={!!errors.branch_id}>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {(isPinned && branch ? [branch] : branches).map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={3} {...register("notes")} />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

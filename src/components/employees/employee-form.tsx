"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useAuth } from "@/lib/auth/auth-context";
import { ASSIGNABLE_ROLES } from "@/hooks/use-employees";
import { ApiClientError } from "@/lib/api/client";
import { optionalPasswordSchema } from "@/lib/validation";
import type { Employee } from "@/types";
import type { EmployeePayload } from "@/services/employees.service";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: optionalPasswordSchema,
  role: z.string().min(1, "Role is required"),
  branch_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EmployeeForm({
  employee,
  onSubmit,
  isSubmitting,
  submitLabel = "Save",
}: {
  employee?: Employee;
  onSubmit: (payload: EmployeePayload) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}) {
  const { branches } = useActiveBranch();
  const { user } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: employee?.name ?? "",
      email: employee?.email ?? "",
      password: "",
      role: employee?.roles?.[0] ?? "cashier",
      branch_id: employee?.branch_id ? String(employee.branch_id) : undefined,
    },
  });

  const submit = async (values: FormValues) => {
    setServerError(null);
    try {
      await onSubmit({
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        role: values.role,
        branch_id: values.branch_id ? Number(values.branch_id) : null,
        // EmployeeController's business_id defaults to null when omitted —
        // unlike Product/Customer/etc. it does NOT fall back to the actor's
        // own business_id server-side, so a fixed-business actor (the
        // overwhelmingly common single-business case) must send it
        // explicitly here or the new employee ends up with no business,
        // which silently breaks every business-scoped feature check for
        // them (found via live testing — see docs/DEVELOPMENT_PROGRESS.md).
        business_id: employee?.business_id ?? user?.business_id ?? undefined,
      });
    } catch (err) {
      if (err instanceof ApiClientError && Object.keys(err.errors).length > 0) {
        Object.entries(err.errors).forEach(([field, messages]) => {
          if (["name", "email", "password", "role", "branch_id"].includes(field)) {
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
          <Field label="Full name" required error={errors.name?.message} className="sm:col-span-2">
            <Input {...register("name")} error={!!errors.name} autoFocus />
          </Field>
          <Field label="Email" required error={errors.email?.message}>
            <Input type="email" {...register("email")} error={!!errors.email} />
          </Field>
          <Field
            label={employee ? "New password" : "Password"}
            required={!employee}
            error={errors.password?.message}
            hint={employee ? "Leave blank to keep the current password" : undefined}
          >
            <Input type="password" {...register("password")} error={!!errors.password} />
          </Field>
          <Field label="Role" required error={errors.role?.message}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Role" error={!!errors.role}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Branch" hint="Leave unassigned for access across all branches">
            <Controller
              control={control}
              name="branch_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Branch">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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

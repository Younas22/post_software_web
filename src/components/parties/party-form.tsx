"use client";

import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/alert";
import { ApiClientError } from "@/lib/api/client";
import type { Customer, Supplier } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export interface PartyPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status: "active" | "inactive";
}

export function PartyForm({
  party,
  onSubmit,
  isSubmitting,
  submitLabel = "Save",
}: {
  party?: Customer | Supplier;
  onSubmit: (payload: PartyPayload) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: party?.name ?? "",
      phone: party?.phone ?? "",
      email: party?.email ?? "",
      address: party?.address ?? "",
      notes: party?.notes ?? "",
      active: party ? party.status === "active" : true,
    },
  });

  const submit = async (values: FormValues) => {
    setServerError(null);
    try {
      await onSubmit({
        name: values.name,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        notes: values.notes || null,
        status: values.active ? "active" : "inactive",
      });
    } catch (err) {
      if (err instanceof ApiClientError && Object.keys(err.errors).length > 0) {
        Object.entries(err.errors).forEach(([field, messages]) => {
          if (["name", "phone", "email", "address", "notes"].includes(field)) {
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
          <Field label="Name" required error={errors.name?.message} className="sm:col-span-2">
            <Input {...register("name")} error={!!errors.name} autoFocus />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input type="tel" {...register("phone")} error={!!errors.phone} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} error={!!errors.email} />
          </Field>
          <Field label="Address" error={errors.address?.message} className="sm:col-span-2">
            <Textarea rows={2} {...register("address")} error={!!errors.address} />
          </Field>
          <Field label="Notes" error={errors.notes?.message} className="sm:col-span-2">
            <Textarea rows={2} {...register("notes")} error={!!errors.notes} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <FieldSwitch control={control} />
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FieldSwitch({ control }: { control: Control<FormValues> }) {
  return (
    <Controller
      control={control}
      name="active"
      render={({ field }) => (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-muted-foreground">Inactive records are hidden from pickers by default.</p>
          </div>
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );
}

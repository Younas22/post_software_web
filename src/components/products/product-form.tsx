"use client";

import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, X } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useBrands } from "@/hooks/use-brands";
import { ApiClientError, storageUrl } from "@/lib/api/client";
import type { Product } from "@/types";
import type { ProductPayload } from "@/services/products.service";
import { cn } from "@/lib/utils";

// Plain z.number() (not z.coerce.number()) so the schema's input and output
// types match exactly — react-hook-form's Resolver type requires that.
// Numeric <input>s are registered with { valueAsNumber: true } below so the
// browser string value is already a number by the time it reaches here.
const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(100),
  barcode: z.string().max(100).optional().or(z.literal("")),
  category_id: z.string().optional(),
  brand_id: z.string().optional(),
  purchase_price: z.number({ error: "Purchase price is required" }).min(0, "Must be 0 or more"),
  sale_price: z.number({ error: "Sale price is required" }).min(0, "Must be 0 or more"),
  tax_rate: z.number().min(0).max(100).optional(),
  unit: z.string().max(20).optional().or(z.literal("")),
  minimum_stock: z.number().min(0).optional(),
  description: z.string().max(2000).optional().or(z.literal("")),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function ProductForm({
  product,
  onSubmit,
  isSubmitting,
  submitLabel = "Save product",
}: {
  product?: Product;
  onSubmit: (payload: ProductPayload) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}) {
  const categories = useCategories({ per_page: 100, status: "active" });
  const brands = useBrands({ per_page: 100, status: "active" });
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(storageUrl(product?.image));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      category_id: product?.category_id ? String(product.category_id) : undefined,
      brand_id: product?.brand_id ? String(product.brand_id) : undefined,
      purchase_price: product ? Number(product.purchase_price) : undefined,
      sale_price: product ? Number(product.sale_price) : undefined,
      tax_rate: product?.tax_rate ? Number(product.tax_rate) : undefined,
      unit: product?.unit ?? "pcs",
      minimum_stock: product?.minimum_stock ?? 0,
      description: product?.description ?? "",
      active: product ? product.status === "active" : true,
    },
  });

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : storageUrl(product?.image));
  };

  const submit = async (values: FormValues) => {
    setServerError(null);
    const payload: ProductPayload = {
      name: values.name,
      sku: values.sku,
      barcode: values.barcode || null,
      category_id: values.category_id ? Number(values.category_id) : null,
      brand_id: values.brand_id ? Number(values.brand_id) : null,
      purchase_price: values.purchase_price,
      sale_price: values.sale_price,
      tax_rate: values.tax_rate ?? null,
      unit: values.unit || "pcs",
      minimum_stock: values.minimum_stock ?? 0,
      status: values.active ? "active" : "inactive",
      description: values.description || null,
      image: imageFile,
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      const formFields: (keyof FormValues)[] = [
        "name", "sku", "barcode", "category_id", "brand_id",
        "purchase_price", "sale_price", "tax_rate", "unit", "minimum_stock", "description",
      ];
      if (err instanceof ApiClientError && Object.keys(err.errors).length > 0) {
        Object.entries(err.errors).forEach(([field, messages]) => {
          if ((formFields as string[]).includes(field)) {
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Basic information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={errors.name?.message} className="sm:col-span-2">
                <Input {...register("name")} error={!!errors.name} autoFocus />
              </Field>
              <Field label="SKU" required error={errors.sku?.message}>
                <Input {...register("sku")} error={!!errors.sku} />
              </Field>
              <Field label="Barcode" error={errors.barcode?.message}>
                <Input {...register("barcode")} error={!!errors.barcode} />
              </Field>
              <Field label="Category">
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="No category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories.data?.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Brand">
                <Controller
                  control={control}
                  name="brand_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="No brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {(brands.data?.data ?? []).map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <Textarea rows={3} {...register("description")} />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Pricing &amp; stock</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Purchase price" required error={errors.purchase_price?.message}>
                <Input type="number" step="0.01" min="0" {...register("purchase_price", { valueAsNumber: true })} error={!!errors.purchase_price} />
              </Field>
              <Field label="Sale price" required error={errors.sale_price?.message}>
                <Input type="number" step="0.01" min="0" {...register("sale_price", { valueAsNumber: true })} error={!!errors.sale_price} />
              </Field>
              <Field label="Tax rate (%)" error={errors.tax_rate?.message} hint="Leave blank to use business default">
                <Input type="number" step="0.01" min="0" max="100" {...register("tax_rate", { valueAsNumber: true })} error={!!errors.tax_rate} />
              </Field>
              <Field label="Unit" error={errors.unit?.message} hint="e.g. pcs, kg, box">
                <Input {...register("unit")} error={!!errors.unit} />
              </Field>
              <Field label="Minimum stock" error={errors.minimum_stock?.message} hint="Triggers a low-stock alert">
                <Input type="number" min="0" step="1" {...register("minimum_stock", { valueAsNumber: true })} error={!!errors.minimum_stock} />
              </Field>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Image</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
            />
            <div
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 text-center transition-colors hover:border-brand/50",
                imagePreview && "border-solid p-0"
              )}
            >
              {imagePreview ? (
                <div className="group relative size-full">
                  {/* eslint-disable-next-line @next/next/no-img-element -- previewing an uploaded File / a backend-hosted product image, not a static asset */}
                  <img src={imagePreview} alt="" className="size-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      handleImageChange(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-6 text-muted-foreground"
                >
                  <ImagePlus className="size-8" />
                  <span className="text-sm font-medium">Upload image</span>
                  <span className="text-xs">PNG or JPG, up to 2MB</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Status</h2>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active</p>
                    <p className="text-xs text-muted-foreground">Inactive products can&apos;t be sold in POS.</p>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </div>
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

"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { ProductForm } from "@/components/products/product-form";
import { useProductMutations } from "@/hooks/use-products";

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { create } = useProductMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Products", href: "/products" }, { label: "New Product" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New Product</h1>
      </div>
      <ProductForm
        submitLabel="Create product"
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const product = await create.mutateAsync(payload);
          toast({ title: "Product created", variant: "success" });
          router.push(`/products/${product.id}`);
        }}
      />
    </div>
  );
}

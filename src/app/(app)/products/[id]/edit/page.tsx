"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { LoadingState } from "@/components/ui/loading-state";
import { ProductForm } from "@/components/products/product-form";
import { useProduct, useProductMutations } from "@/hooks/use-products";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = Number(id);
  const router = useRouter();
  const { toast } = useToast();
  const { update } = useProductMutations();
  const { data: product, isLoading } = useProduct(productId);

  if (isLoading || !product) {
    return <LoadingState label="Loading product…" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Products", href: "/products" }, { label: product.name, href: `/products/${productId}` }, { label: "Edit" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">Edit Product</h1>
      </div>
      <ProductForm
        product={product}
        submitLabel="Save changes"
        isSubmitting={update.isPending}
        onSubmit={async (payload) => {
          await update.mutateAsync({ id: productId, payload });
          toast({ title: "Product updated", variant: "success" });
          router.push(`/products/${productId}`);
        }}
      />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { ProductForm } from "@/components/products/product-form";
import { useProductMutations } from "@/hooks/use-products";
import { useTerms } from "@/hooks/use-branding";

export default function NewProductPage() {
  const terms = useTerms();
  const router = useRouter();
  const { toast } = useToast();
  const { create } = useProductMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: terms.products, href: "/products" }, { label: `New ${terms.product}` }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New {terms.product}</h1>
      </div>
      <ProductForm
        submitLabel={`Create ${terms.product.toLowerCase()}`}
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const product = await create.mutateAsync(payload);
          toast({ title: `${terms.product} created`, variant: "success" });
          router.push(`/products/${product.id}`);
        }}
      />
    </div>
  );
}

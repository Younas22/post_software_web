"use client";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NameStatusManager } from "@/components/products/name-status-manager";
import { useCategories, useCategoryMutations } from "@/hooks/use-categories";
import { useBrands, useBrandMutations } from "@/hooks/use-brands";

export default function CategoriesPage() {
  const categories = useCategories({ per_page: 100 });
  const categoryMutations = useCategoryMutations();
  const brands = useBrands({ per_page: 100 });
  const brandMutations = useBrandMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Products", href: "/products" }, { label: "Categories & Brands" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">Categories &amp; Brands</h1>
        <p className="mt-1 text-sm text-muted-foreground">Organize your product catalog.</p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <NameStatusManager
            label="Category"
            pluralLabel="Categories"
            items={categories.data?.data ?? []}
            isLoading={categories.isLoading}
            onCreate={(p) => categoryMutations.create.mutateAsync(p)}
            onUpdate={(id, p) => categoryMutations.update.mutateAsync({ id, payload: p })}
            onDelete={(id) => categoryMutations.remove.mutateAsync(id)}
            isMutating={categoryMutations.create.isPending || categoryMutations.update.isPending}
          />
        </TabsContent>
        <TabsContent value="brands">
          <NameStatusManager
            label="Brand"
            pluralLabel="Brands"
            items={brands.data?.data ?? []}
            isLoading={brands.isLoading}
            onCreate={(p) => brandMutations.create.mutateAsync(p)}
            onUpdate={(id, p) => brandMutations.update.mutateAsync({ id, payload: p })}
            onDelete={(id) => brandMutations.remove.mutateAsync(id)}
            isMutating={brandMutations.create.isPending || brandMutations.update.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

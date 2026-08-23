"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { PartyForm } from "@/components/parties/party-form";
import { useSupplierMutations } from "@/hooks/use-suppliers";

export default function NewSupplierPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { create } = useSupplierMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Suppliers", href: "/suppliers" }, { label: "New Supplier" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New Supplier</h1>
      </div>
      <PartyForm
        submitLabel="Create supplier"
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const supplier = await create.mutateAsync(payload);
          toast({ title: "Supplier created", variant: "success" });
          router.push(`/suppliers/${supplier.id}`);
        }}
      />
    </div>
  );
}

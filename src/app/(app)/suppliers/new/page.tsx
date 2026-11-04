"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { PartyForm } from "@/components/parties/party-form";
import { useSupplierMutations } from "@/hooks/use-suppliers";
import { useTerms } from "@/hooks/use-branding";

export default function NewSupplierPage() {
  const terms = useTerms();
  const router = useRouter();
  const { toast } = useToast();
  const { create } = useSupplierMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: terms.suppliers, href: "/suppliers" }, { label: `New ${terms.supplier}` }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New {terms.supplier}</h1>
      </div>
      <PartyForm
        submitLabel={`Create ${terms.supplier.toLowerCase()}`}
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const supplier = await create.mutateAsync(payload);
          toast({ title: `${terms.supplier} created`, variant: "success" });
          router.push(`/suppliers/${supplier.id}`);
        }}
      />
    </div>
  );
}

"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { LoadingState } from "@/components/ui/loading-state";
import { PartyForm } from "@/components/parties/party-form";
import { useSupplier, useSupplierMutations } from "@/hooks/use-suppliers";
import { useTerms } from "@/hooks/use-branding";

export default function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const terms = useTerms();
  const { id } = use(params);
  const supplierId = Number(id);
  const router = useRouter();
  const { toast } = useToast();
  const { update } = useSupplierMutations();
  const { data: supplier, isLoading } = useSupplier(supplierId);

  if (isLoading || !supplier) return <LoadingState label={`Loading ${terms.supplier.toLowerCase()}…`} />;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: terms.suppliers, href: "/suppliers" }, { label: supplier.name, href: `/suppliers/${supplierId}` }, { label: "Edit" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">Edit {terms.supplier}</h1>
      </div>
      <PartyForm
        party={supplier}
        submitLabel="Save changes"
        isSubmitting={update.isPending}
        onSubmit={async (payload) => {
          await update.mutateAsync({ id: supplierId, payload });
          toast({ title: `${terms.supplier} updated`, variant: "success" });
          router.push(`/suppliers/${supplierId}`);
        }}
      />
    </div>
  );
}

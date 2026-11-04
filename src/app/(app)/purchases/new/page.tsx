"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { usePurchaseMutations } from "@/hooks/use-purchases";
import { useTerms } from "@/hooks/use-branding";

export default function NewPurchasePage() {
  const terms = useTerms();
  const router = useRouter();
  const { toast } = useToast();
  const { create } = usePurchaseMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: terms.purchases, href: "/purchases" }, { label: `New ${terms.purchase}` }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New {terms.purchase}</h1>
      </div>
      <PurchaseForm
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const purchase = await create.mutateAsync(payload);
          toast({ title: `${terms.purchase} created`, variant: "success" });
          router.push(`/purchases/${purchase.id}`);
        }}
      />
    </div>
  );
}

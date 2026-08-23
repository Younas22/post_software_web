"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { usePurchaseMutations } from "@/hooks/use-purchases";

export default function NewPurchasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { create } = usePurchaseMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Purchases", href: "/purchases" }, { label: "New Purchase" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New Purchase</h1>
      </div>
      <PurchaseForm
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const purchase = await create.mutateAsync(payload);
          toast({ title: "Purchase created", variant: "success" });
          router.push(`/purchases/${purchase.id}`);
        }}
      />
    </div>
  );
}

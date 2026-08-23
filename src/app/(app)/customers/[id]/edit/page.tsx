"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { LoadingState } from "@/components/ui/loading-state";
import { PartyForm } from "@/components/parties/party-form";
import { useCustomer, useCustomerMutations } from "@/hooks/use-customers";

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const customerId = Number(id);
  const router = useRouter();
  const { toast } = useToast();
  const { update } = useCustomerMutations();
  const { data: customer, isLoading } = useCustomer(customerId);

  if (isLoading || !customer) return <LoadingState label="Loading customer…" />;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Customers", href: "/customers" }, { label: customer.name, href: `/customers/${customerId}` }, { label: "Edit" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">Edit Customer</h1>
      </div>
      <PartyForm
        party={customer}
        submitLabel="Save changes"
        isSubmitting={update.isPending}
        onSubmit={async (payload) => {
          await update.mutateAsync({ id: customerId, payload });
          toast({ title: "Customer updated", variant: "success" });
          router.push(`/customers/${customerId}`);
        }}
      />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { PartyForm } from "@/components/parties/party-form";
import { useCustomerMutations } from "@/hooks/use-customers";

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { create } = useCustomerMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Customers", href: "/customers" }, { label: "New Customer" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New Customer</h1>
      </div>
      <PartyForm
        submitLabel="Create customer"
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const customer = await create.mutateAsync(payload);
          toast({ title: "Customer created", variant: "success" });
          router.push(`/customers/${customer.id}`);
        }}
      />
    </div>
  );
}

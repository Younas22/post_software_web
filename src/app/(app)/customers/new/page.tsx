"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { PartyForm } from "@/components/parties/party-form";
import { useCustomerMutations } from "@/hooks/use-customers";
import { useTerms } from "@/hooks/use-branding";

export default function NewCustomerPage() {
  const terms = useTerms();
  const router = useRouter();
  const { toast } = useToast();
  const { create } = useCustomerMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: terms.customers, href: "/customers" }, { label: `New ${terms.customer}` }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New {terms.customer}</h1>
      </div>
      <PartyForm
        submitLabel={`Create ${terms.customer.toLowerCase()}`}
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const customer = await create.mutateAsync(payload);
          toast({ title: `${terms.customer} created`, variant: "success" });
          router.push(`/customers/${customer.id}`);
        }}
      />
    </div>
  );
}

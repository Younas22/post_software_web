"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { EmployeeForm } from "@/components/employees/employee-form";
import { useEmployeeMutations } from "@/hooks/use-employees";
import { ApiClientError } from "@/lib/api/client";

export default function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { create } = useEmployeeMutations();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Employees", href: "/employees" }, { label: "New Employee" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">New Employee</h1>
      </div>
      <EmployeeForm
        submitLabel="Create employee"
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          if (!payload.password) {
            // Client-side re-assertion of what the form's zod schema already
            // requires for a *new* employee (password is only optional on
            // edit) — surfaced the same way a real 422 would be.
            throw new ApiClientError("The password field is required.", 422, { password: ["The password field is required."] });
          }
          const employee = await create.mutateAsync(payload);
          toast({ title: "Employee created", variant: "success" });
          router.push(`/employees/${employee.id}`);
        }}
      />
    </div>
  );
}

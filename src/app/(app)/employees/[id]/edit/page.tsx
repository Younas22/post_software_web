"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { LoadingState } from "@/components/ui/loading-state";
import { EmployeeForm } from "@/components/employees/employee-form";
import { useEmployee, useEmployeeMutations } from "@/hooks/use-employees";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employeeId = Number(id);
  const router = useRouter();
  const { toast } = useToast();
  const { update } = useEmployeeMutations();
  const { data: employee, isLoading } = useEmployee(employeeId);

  if (isLoading || !employee) return <LoadingState label="Loading employee…" />;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Employees", href: "/employees" }, { label: employee.name, href: `/employees/${employeeId}` }, { label: "Edit" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">Edit Employee</h1>
      </div>
      <EmployeeForm
        employee={employee}
        submitLabel="Save changes"
        isSubmitting={update.isPending}
        onSubmit={async (payload) => {
          await update.mutateAsync({ id: employeeId, payload });
          toast({ title: "Employee updated", variant: "success" });
          router.push(`/employees/${employeeId}`);
        }}
      />
    </div>
  );
}

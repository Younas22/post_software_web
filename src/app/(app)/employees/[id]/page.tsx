"use client";

import { use } from "react";
import Link from "next/link";
import { Pencil, Mail, Building2, Shield, Calendar } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { useEmployee, ASSIGNABLE_ROLES } from "@/hooks/use-employees";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";

export default function EmployeeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employeeId = Number(id);
  const { hasPermission } = useAuth();
  const { data: employee, isLoading } = useEmployee(employeeId);

  if (isLoading || !employee) return <LoadingState label="Loading employee…" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Employees", href: "/employees" }, { label: employee.name }]} />
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={employee.name} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{employee.name}</h1>
              <StatusBadge status={employee.status} />
            </div>
          </div>
        </div>
        {hasPermission("users.update") && (
          <Button variant="outline" asChild>
            <Link href={`/employees/${employeeId}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="size-4 text-muted-foreground" /> {employee.email}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Shield className="size-4 text-muted-foreground" />
            <Badge variant="brand">{ASSIGNABLE_ROLES.find((r) => r.value === employee.roles?.[0])?.label ?? employee.roles?.[0] ?? "—"}</Badge>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Building2 className="size-4 text-muted-foreground" /> {employee.branch?.name ?? "All branches"}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="size-4 text-muted-foreground" /> Joined {formatDate(employee.created_at)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

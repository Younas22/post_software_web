"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, UserCog, Pencil, Power, PowerOff, MoreVertical } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useEmployees, useEmployeeMutations, ASSIGNABLE_ROLES } from "@/hooks/use-employees";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/ui/search";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api/client";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const subscription = useSubscription();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const employees = useEmployees({ search: search || undefined, page, per_page: 15 });
  const mutations = useEmployeeMutations();

  const canCreate = hasPermission("users.create");
  const canUpdate = hasPermission("users.update");
  const usage = subscription.data?.usage.users;
  const atLimit = usage?.limit !== null && usage?.limit !== undefined && usage.used >= usage.limit;

  const handleToggle = async (employee: Employee) => {
    const activating = employee.status !== "active";
    const ok = await confirm({
      title: `${activating ? "Activate" : "Deactivate"} ${employee.name}?`,
      description: activating ? "They'll regain access and count toward your user seat limit." : "They'll immediately lose access.",
      confirmLabel: activating ? "Activate" : "Deactivate",
      variant: activating ? "primary" : "danger",
    });
    if (!ok) return;
    try {
      await (activating ? mutations.activate : mutations.deactivate).mutateAsync(employee.id);
      toast({ title: `Employee ${activating ? "activated" : "deactivated"}`, variant: "success" });
    } catch (err) {
      toast({ title: "Action failed", description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
    }
  };

  const columns: DataTableColumn<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      render: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.name} size="sm" />
          <div>
            <p className="font-medium text-foreground">{e.name}</p>
            <p className="text-xs text-muted-foreground">{e.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (e) => <Badge variant="brand">{ASSIGNABLE_ROLES.find((r) => r.value === e.roles?.[0])?.label ?? e.roles?.[0] ?? "—"}</Badge>,
    },
    { key: "branch", header: "Branch", render: (e) => e.branch?.name ?? "All branches" },
    { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (e) =>
        canUpdate && (
          <Dropdown>
            <DropdownTrigger asChild>
              <IconButton aria-label={`Actions for ${e.name}`} variant="ghost" size="sm" onClick={(ev) => ev.stopPropagation()}>
                <MoreVertical />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onSelect={() => router.push(`/employees/${e.id}/edit`)}>
                <Pencil className="size-4" /> Edit
              </DropdownItem>
              <DropdownItem destructive={e.status === "active"} onSelect={() => handleToggle(e)}>
                {e.status === "active" ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                {e.status === "active" ? "Deactivate" : "Activate"}
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team.
            {usage && (
              <span className="ml-1">
                {usage.used}/{usage.limit ?? "∞"} seats used.
              </span>
            )}
          </p>
        </div>
        {canCreate && (
          <Button asChild disabled={atLimit}>
            <Link href="/employees/new">
              <Plus /> New Employee
            </Link>
          </Button>
        )}
      </div>

      {atLimit && (
        <p className="text-sm text-warning">
          You&apos;ve reached your plan&apos;s user limit. <Link href="/subscription" className="underline">Upgrade your plan</Link> to add more.
        </p>
      )}

      <Search value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email…" className="sm:max-w-xs" />

      <DataTable
        columns={columns}
        rows={employees.data?.data ?? []}
        isLoading={employees.isLoading}
        meta={employees.data?.meta}
        onPageChange={setPage}
        onRowClick={(e) => router.push(`/employees/${e.id}`)}
        emptyIcon={UserCog}
        emptyTitle="No employees yet"
        emptyDescription="Invite your team to start collaborating."
      />
      {dialog}
    </div>
  );
}

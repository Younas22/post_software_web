"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Building2, Pencil, Power, PowerOff, MoreVertical, Star } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useAllBranches, useBranchMutations } from "@/hooks/use-branches";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { BranchModal } from "@/components/branches/branch-modal";
import { ApiClientError } from "@/lib/api/client";
import type { Branch } from "@/types";

export default function BranchesPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const subscription = useSubscription();

  const branches = useAllBranches();
  const mutations = useBranchMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const canManage = hasPermission("businesses.update");
  const usage = subscription.data?.usage.branches;
  const atLimit = usage?.limit !== null && usage?.limit !== undefined && usage.used >= usage.limit;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setModalOpen(true);
  };

  const handleToggle = async (branch: Branch) => {
    const activating = branch.status !== "active";
    const ok = await confirm({
      title: `${activating ? "Activate" : "Deactivate"} "${branch.name}"?`,
      confirmLabel: activating ? "Activate" : "Deactivate",
      variant: activating ? "primary" : "danger",
    });
    if (!ok) return;
    try {
      await (activating ? mutations.activate : mutations.deactivate).mutateAsync(branch.id);
      toast({ title: `Branch ${activating ? "activated" : "deactivated"}`, variant: "success" });
    } catch (err) {
      toast({ title: "Action failed", description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
    }
  };

  const columns: DataTableColumn<Branch>[] = [
    {
      key: "name",
      header: "Branch",
      render: (b) => (
        <span className="flex items-center gap-2 font-medium text-foreground">
          {b.name}
          {b.is_main && <Badge variant="brand"><Star className="mr-1 size-3" />Main</Badge>}
        </span>
      ),
    },
    { key: "code", header: "Code", render: (b) => b.code ?? "—" },
    { key: "phone", header: "Phone", render: (b) => b.phone ?? "—" },
    { key: "status", header: "Status", render: (b) => <StatusBadge status={b.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (b) =>
        canManage && (
          <Dropdown>
            <DropdownTrigger asChild>
              <IconButton aria-label={`Actions for ${b.name}`} variant="ghost" size="sm">
                <MoreVertical />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onSelect={() => openEdit(b)}>
                <Pencil className="size-4" /> Edit
              </DropdownItem>
              <DropdownItem destructive={b.status === "active"} onSelect={() => handleToggle(b)}>
                {b.status === "active" ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                {b.status === "active" ? "Deactivate" : "Activate"}
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
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Branches</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your business locations.
            {usage && (
              <span className="ml-1">
                {usage.used}/{usage.limit ?? "∞"} used.
              </span>
            )}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} disabled={atLimit}>
            <Plus /> New Branch
          </Button>
        )}
      </div>

      {atLimit && (
        <p className="text-sm text-warning">
          You&apos;ve reached your plan&apos;s branch limit. <Link href="/subscription" className="underline">Upgrade your plan</Link> to add more.
        </p>
      )}

      <DataTable
        columns={columns}
        rows={branches.data ?? []}
        isLoading={branches.isLoading}
        emptyIcon={Building2}
        emptyTitle="No branches yet"
        emptyDescription="Add your first branch location."
      />

      <BranchModal open={modalOpen} onOpenChange={setModalOpen} branch={editing} />
      {dialog}
    </div>
  );
}

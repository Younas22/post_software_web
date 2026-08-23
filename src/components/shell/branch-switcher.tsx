"use client";

import { Building2 } from "lucide-react";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

/** Shown in the Topbar. A branch-pinned user (Manager/Cashier) sees a static label; anyone else gets a switcher. */
export function BranchSwitcher() {
  const { branch, branches, isPinned, branchId, setActiveBranchId } = useActiveBranch();

  if (branches.length === 0 && !branch) return null;

  if (isPinned || branches.length <= 1) {
    return (
      <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
        <Building2 className="size-4" aria-hidden />
        {branch?.name ?? "—"}
      </div>
    );
  }

  return (
    <Select value={branchId ? String(branchId) : undefined} onValueChange={(v) => setActiveBranchId(Number(v))}>
      <SelectTrigger className="h-9 w-auto gap-1.5 border-none bg-transparent px-2 shadow-none hover:bg-muted">
        <Building2 className="size-4 text-muted-foreground" aria-hidden />
        <SelectValue placeholder="Select branch" />
      </SelectTrigger>
      <SelectContent align="start">
        {branches.map((b) => (
          <SelectItem key={b.id} value={String(b.id)}>
            <span className="flex items-center gap-2">
              {b.name}
              {b.is_main && (
                <Badge variant="brand" className="py-0">
                  Main
                </Badge>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

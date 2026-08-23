import { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranchStore } from "@/store/branch-store";
import { useBranches } from "./use-branches";

/**
 * Resolves the branch a user is currently working in. A user pinned to one
 * branch (Manager/Cashier — branch_id set on their account) always uses
 * that; anyone else (Client Owner/Business Admin) picks via the Topbar
 * branch switcher, persisted in useBranchStore, defaulting to their
 * business's main branch (or the first one) the first time it's unset.
 */
export function useActiveBranch() {
  const { user } = useAuth();
  const pinned = user?.branch_id ?? null;
  const { activeBranchId, setActiveBranchId } = useBranchStore();
  const branchesQuery = useBranches(!pinned && !!user);

  const branches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);

  useEffect(() => {
    if (pinned || activeBranchId || branches.length === 0) return;
    const main = branches.find((b) => b.is_main) ?? branches[0];
    setActiveBranchId(main.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned, activeBranchId, branches.length]);

  const branchId = pinned ?? activeBranchId;

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? null,
    [branches, branchId]
  );

  return {
    branchId,
    branch: activeBranch,
    branches,
    isPinned: pinned !== null,
    isLoading: branchesQuery.isLoading,
    setActiveBranchId,
  };
}

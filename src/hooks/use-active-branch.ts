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
 *
 * The branch list is always fetched (once authenticated) — a pinned actor
 * still needs their own branch's full record (name, is_main, ...), not
 * just its id, so `GET /branches` runs either way and is then narrowed to
 * just their one branch before being exposed as `branches`.
 */
export function useActiveBranch() {
  const { user } = useAuth();
  const pinned = user?.branch_id ?? null;
  const { activeBranchId, setActiveBranchId } = useBranchStore();
  const branchesQuery = useBranches(!!user);

  const allBranches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);
  const branches = useMemo(
    () => (pinned ? allBranches.filter((b) => b.id === pinned) : allBranches),
    [allBranches, pinned]
  );

  useEffect(() => {
    if (pinned || activeBranchId || branches.length === 0) return;
    const main = branches.find((b) => b.is_main) ?? branches[0];
    setActiveBranchId(main.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned, activeBranchId, branches.length]);

  const branchId = pinned ?? activeBranchId;

  const activeBranch = useMemo(
    () => allBranches.find((b) => b.id === branchId) ?? null,
    [allBranches, branchId]
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

import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";
import { useAuth } from "@/lib/auth/auth-context";

export function useSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => subscriptionService.get(),
    enabled: !!user && !user.is_super_admin,
    staleTime: 60_000,
  });
}

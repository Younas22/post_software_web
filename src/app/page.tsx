"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { loginPath } from "@/lib/branding";
import { LoadingState } from "@/components/ui/loading-state";

export default function RootPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? "/dashboard" : loginPath());
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <LoadingState label="Loading…" />
    </div>
  );
}

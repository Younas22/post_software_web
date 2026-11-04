"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { loginPath } from "@/lib/branding";
import { AppShell } from "@/components/shell/app-shell";
import { LoadingState } from "@/components/ui/loading-state";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(loginPath());
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <LoadingState label="Loading your workspace…" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

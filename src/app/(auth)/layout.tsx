"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Zap className="size-4.5" fill="currentColor" aria-hidden />
          </div>
          <span className="text-base font-semibold text-foreground">POS</span>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">{children}</main>
    </div>
  );
}

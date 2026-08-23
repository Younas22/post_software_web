"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider delayDuration={200}>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { SubscriptionBanner } from "./subscription-banner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <SubscriptionBanner />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

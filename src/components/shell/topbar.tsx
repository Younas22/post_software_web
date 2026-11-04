"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileNav } from "./mobile-nav";
import { BranchSwitcher } from "./branch-switcher";
import { NotificationsBell } from "./notifications-bell";
import { ProfileMenu } from "./profile-menu";
import { BusinessBrand } from "./business-brand";

function OnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Reads the browser's current connectivity (an external system) once on
    // mount, then subscribes to changes — the recommended shape for this,
    // despite the linter's blanket "no setState in effect" heuristic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <span
      className="hidden items-center gap-1.5 text-xs font-medium sm:flex"
      style={{ color: online ? "var(--success)" : "var(--error)" }}
      role="status"
    >
      {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
      {online ? "Online" : "Offline"}
    </span>
  );
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <MobileNav />
      <BusinessBrand size="sm" showName={false} className="lg:hidden" />
      <BranchSwitcher />
      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        <OnlineStatus />
        <NotificationsBell />
        <ProfileMenu />
      </div>
    </header>
  );
}

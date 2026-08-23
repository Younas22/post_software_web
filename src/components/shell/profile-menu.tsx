"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <Dropdown>
      <DropdownTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar name={user.name} size="sm" />
      </DropdownTrigger>
      <DropdownContent align="end" className="w-64">
        <DropdownLabel className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href="/settings/profile" className="flex items-center gap-2">
            <UserIcon className="size-4" /> Profile
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="size-4" /> Account settings
          </Link>
        </DropdownItem>
        <DropdownSeparator />
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm text-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <DropdownSeparator />
        <DropdownItem
          destructive
          onSelect={() => {
            logout().then(() => router.replace("/login"));
          }}
          className="flex items-center gap-2"
        >
          <LogOut className="size-4" /> Log out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

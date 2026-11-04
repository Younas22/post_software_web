"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Building2, Camera, ChevronDown, CreditCard, LogOut, Monitor, Moon, Settings, Sun, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { loginPath } from "@/lib/branding";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/** Top-right account menu: who you are (with your photo), quick links, appearance and sign out. */
export function ProfileMenu() {
  const { user, config, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const role = user.is_super_admin ? "Super Admin" : user.roles[0]?.replace(/-/g, " ");
  const business = config?.business?.name;

  return (
    <Dropdown>
      <DropdownTrigger
        className="group flex items-center gap-2 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted sm:pr-2"
        aria-label="Account menu"
      >
        <Avatar name={user.name} src={user.avatar_url} size="md" className="ring-2 ring-background" />
        <span className="hidden max-w-32 truncate text-sm font-medium text-foreground md:block">{user.name.split(" ")[0]}</span>
        <ChevronDown className="hidden size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 md:block" aria-hidden />
      </DropdownTrigger>

      <DropdownContent align="end" sideOffset={8} className="w-[300px] rounded-2xl p-0">
        {/* Identity */}
        <div className="flex items-center gap-3 border-b border-border bg-muted/50 p-4">
          <Link href="/settings/profile" className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Change profile photo">
            <Avatar name={user.name} src={user.avatar_url} size="lg" />
            <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-popover bg-brand text-brand-foreground">
              <Camera className="size-2.5" aria-hidden />
            </span>
          </Link>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {role && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium capitalize text-brand">{role}</span>}
              {business && (
                <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
                  <Building2 className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{business}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="p-1.5">
          <MenuLink href="/settings/profile" icon={UserIcon} label="My profile" hint="Photo, name & password" />
          <MenuLink href="/settings" icon={Settings} label="Settings" hint="Business & preferences" />
          {!user.is_super_admin && <MenuLink href="/subscription" icon={CreditCard} label="Subscription" hint="Plan & usage" />}
        </div>

        <DropdownSeparator className="mx-0 my-0" />

        {/* Appearance */}
        <div className="p-3">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>
          <ThemeTiles />
        </div>

        <DropdownSeparator className="mx-0 my-0" />

        <div className="p-1.5">
          <DropdownItem
            destructive
            onSelect={() => {
              logout().then(() => router.replace(loginPath()));
            }}
            className="gap-3 rounded-xl px-3 py-2.5 font-medium"
          >
            <LogOut className="size-[18px]" /> Log out
          </DropdownItem>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

function MenuLink({ href, icon: Icon, label, hint }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; hint: string }) {
  return (
    <DropdownItem asChild className="gap-3 rounded-xl px-3 py-2">
      <Link href={href}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">{label}</span>
          <span className="block truncate text-xs text-muted-foreground">{hint}</span>
        </span>
      </Link>
    </DropdownItem>
  );
}

/** Three equal tiles — fits the menu width and reads clearly, unlike a cramped inline segmented control. */
function ThemeTiles() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // next-themes only knows the stored theme after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
      {THEMES.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-brand bg-brand-soft text-brand" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

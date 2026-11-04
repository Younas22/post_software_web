"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { cn, getInitials } from "@/lib/utils";

/**
 * The client's own business identity (logo + name) for the app chrome —
 * so the POS feels like *their* software. Falls back to the business
 * initials on a brand-coloured tile when no logo is uploaded (or it fails
 * to load).
 */
export function BusinessBrand({
  size = "md",
  showName = true,
  className,
}: {
  size?: "sm" | "md";
  showName?: boolean;
  className?: string;
}) {
  const { config, user } = useAuth();
  const name = config?.business?.name ?? (user?.is_super_admin ? "Admin" : "POS");
  const logo = config?.business?.logo_url ?? null;
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const showLogo = logo && failedLogo !== logo;

  const tile = size === "sm" ? "size-7 rounded-md text-xs" : "size-9 rounded-lg text-sm";

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded business logo served by the Laravel backend
        <img
          src={logo}
          alt=""
          className={cn("shrink-0 border border-border bg-white object-contain p-0.5", tile)}
          onError={() => setFailedLogo(logo)}
        />
      ) : (
        <div className={cn("flex shrink-0 items-center justify-center bg-brand font-semibold text-brand-foreground", tile)} aria-hidden>
          {getInitials(name)}
        </div>
      )}
      {showName ? (
        <span className="truncate text-base font-semibold text-sidebar-foreground" title={name}>
          {name}
        </span>
      ) : (
        <span className="sr-only">{name}</span>
      )}
    </div>
  );
}

/**
 * Brands the browser tab with the business too: title suffix and favicon
 * use the business name/logo instead of the generic product identity.
 */
export function BusinessDocumentBranding() {
  const { config } = useAuth();
  const name = config?.business?.name;
  const logo = config?.business?.logo_url;

  useEffect(() => {
    if (!name) return;
    const base = document.title.split(" · ")[0] || "POS";
    document.title = base === name || base === "POS" ? name : `${base} · ${name}`;
  });

  useEffect(() => {
    if (!logo) return;
    let link = document.querySelector<HTMLLinkElement>("link[data-business-favicon]");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.dataset.businessFavicon = "true";
      document.head.appendChild(link);
    }
    link.href = logo;
  }, [logo]);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranding } from "@/hooks/use-branding";
import { applyBrandTheme, rememberLoginSlug } from "@/lib/branding";
import { cn, getInitials } from "@/lib/utils";

/**
 * The client's own business identity (logo + name, with the business type
 * underneath) for the app chrome — so the POS feels like *their* software.
 * Falls back to the business initials on a brand-coloured tile when no logo
 * is uploaded (or it fails to load).
 */
export function BusinessBrand({
  size = "md",
  showName = true,
  showType = true,
  tone = "sidebar",
  className,
}: {
  size?: "sm" | "md";
  showName?: boolean;
  showType?: boolean;
  /** "sidebar" follows the sidebar's own (possibly dark/brand) colours. */
  tone?: "sidebar" | "default";
  className?: string;
}) {
  const { config, user } = useAuth();
  const { typeName } = useBranding();
  const name = config?.business?.name ?? (user?.is_super_admin ? "Admin" : "Universal POS");
  const logo = config?.business?.logo_url ?? null;
  // A load failure is retried (twice, with a cache-busting query) before
  // falling back to initials — a large logo on a busy local server can fail
  // once transiently, and one hiccup shouldn't hide the logo for the session.
  const [failure, setFailure] = useState<{ logo: string; count: number } | null>(null);
  const failures = failure && failure.logo === logo ? failure.count : 0;
  const showLogo = logo && failures <= 2;
  const logoSrc = logo && failures > 0 ? `${logo}${logo.includes("?") ? "&" : "?"}retry=${failures}` : logo;

  const tile = size === "sm" ? "size-8 rounded-lg text-xs" : "size-10 rounded-xl text-sm";
  const nameColor = tone === "sidebar" ? "text-sidebar-foreground" : "text-foreground";
  const subColor = tone === "sidebar" ? "text-sidebar-muted" : "text-muted-foreground";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded business logo served by the Laravel backend
        <img
          key={logoSrc}
          src={logoSrc ?? undefined}
          alt=""
          className={cn("shrink-0 border border-black/5 bg-white object-contain p-0.5 shadow-xs", tile)}
          onError={() => {
            const next = failures + 1;
            if (next <= 2) {
              setTimeout(() => setFailure({ logo, count: next }), 1500 * next);
            } else {
              setFailure({ logo, count: next });
            }
          }}
        />
      ) : (
        <div
          className={cn("flex shrink-0 items-center justify-center bg-brand font-bold text-brand-foreground shadow-xs ring-1 ring-black/5", tile)}
          aria-hidden
        >
          {getInitials(name)}
        </div>
      )}
      {showName ? (
        <div className="min-w-0 leading-tight">
          <p className={cn("truncate font-semibold", size === "sm" ? "text-sm" : "text-[15px]", nameColor)} title={name}>
            {name}
          </p>
          {showType && typeName && <p className={cn("truncate text-xs", subColor)}>{typeName}</p>}
        </div>
      ) : (
        <span className="sr-only">{name}</span>
      )}
    </div>
  );
}

/**
 * Brands the whole document for the signed-in business: its type's colour
 * and sidebar style, the tab title suffix and favicon. Also remembers the
 * type's login URL so logging out lands on the branded login page.
 */
export function BusinessDocumentBranding() {
  const { config } = useAuth();
  const name = config?.business?.name;
  const logo = config?.business?.logo_url;
  const favicon = config?.business?.favicon_url;
  const brandType = config?.business_type ?? null;
  const color = brandType?.theme.primary_color;
  const sidebar = brandType?.theme.sidebar_style;
  const slug = brandType?.slug;

  useEffect(() => {
    applyBrandTheme(color ? { primary_color: color, sidebar_style: sidebar ?? "light" } : null);
    rememberLoginSlug(slug);
  }, [color, sidebar, slug]);

  useEffect(() => {
    if (!name) return;
    const base = document.title.split(" · ")[0] || "POS";
    document.title = base === name || base === "POS" || base === "Universal POS" ? name : `${base} · ${name}`;
  });

  // Tab icon: the business's own favicon, else its logo, else the platform icon.
  useEffect(() => applyFavicon(favicon ?? logo ?? null), [favicon, logo]);

  return null;
}

/**
 * Points every icon <link> the page already has (Next.js emits
 * /favicon.ico and /icon.svg) at `href` — only adding one more link
 * wouldn't reliably win, browsers may keep showing the first. The original
 * hrefs are remembered so passing null restores the platform icon (e.g.
 * after switching to a business with no logo).
 */
function applyFavicon(href: string | null) {
  const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
  if (links.length === 0 && href) {
    const link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
    links.push(link);
  }
  links.forEach((link) => {
    if (link.dataset.originalHref === undefined) link.dataset.originalHref = link.getAttribute("href") ?? "";
    if (href) {
      link.href = href;
      // The original type (e.g. image/svg+xml) would no longer be true.
      link.removeAttribute("type");
      link.removeAttribute("sizes");
    } else if (link.dataset.originalHref) {
      link.href = link.dataset.originalHref;
    }
  });
}

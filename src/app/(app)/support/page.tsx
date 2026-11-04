"use client";

import { useState } from "react";
import { Check, Clock, Copy, ExternalLink, Globe, LifeBuoy, Mail, MapPin, MessageCircle, MessagesSquare, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranding } from "@/hooks/use-branding";
import { phoneDigits, telHref, usePlatformInfo } from "@/hooks/use-platform";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Help & Support — the POS company's contact channels (Super Admin →
 * System Settings): live chat, phone, WhatsApp, email and office address,
 * plus the account details a support agent will ask for.
 */
export default function SupportPage() {
  const platform = usePlatformInfo();
  const p = platform.data;
  const company = p?.name || "our team";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-brand p-6 text-brand-foreground shadow-sm sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border-[32px] border-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <LifeBuoy className="size-6" aria-hidden />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">How can we help?</h1>
            <p className="mt-1.5 text-sm opacity-90 sm:text-base">
              Questions, training or a problem with the software — {company} support is here for you.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            {(p?.support_whatsapp || p?.support_phone) && (
              <div className="flex flex-wrap gap-2">
                {p?.support_whatsapp && (
                  <a
                    href={`https://wa.me/${phoneDigits(p.support_whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1ebe5b]"
                  >
                    <WhatsAppIcon className="size-5" /> Chat on WhatsApp
                  </a>
                )}
                {p?.support_phone && (
                  <a
                    href={telHref(p.support_phone)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-semibold ring-1 ring-white/25 transition-colors hover:bg-white/25"
                  >
                    <Phone className="size-4" /> Call
                  </a>
                )}
              </div>
            )}
          {p?.support_hours && (
            <div className="flex items-center gap-2.5 rounded-xl bg-white/15 px-4 py-3 text-sm ring-1 ring-white/20">
              <Clock className="size-5 shrink-0" aria-hidden />
              <div>
                <p className="text-xs opacity-80">Support hours</p>
                <p className="font-semibold">{p.support_hours}</p>
              </div>
            </div>
          )}
          </div>
        </div>
      </section>

      {platform.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Live chat — the primary channel */}
          <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <MessagesSquare className="size-7" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Live chat</h2>
                {p?.live_chat_url ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                    <span className="size-1.5 rounded-full bg-success" /> Available
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Coming soon</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {p?.live_chat_url
                  ? "Chat with a support agent right now — the fastest way to get help."
                  : p?.support_whatsapp
                    ? "Live chat is coming soon — until then, chat with us on WhatsApp."
                    : "Live chat is being set up. Meanwhile, call or email us below."}
              </p>
            </div>
            {p?.live_chat_url ? (
              <Button asChild size="lg" className="shrink-0 rounded-xl">
                <a href={p.live_chat_url} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> Start live chat
                </a>
              </Button>
            ) : (
              p?.support_whatsapp ? (
                <a
                  href={`https://wa.me/${phoneDigits(p.support_whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#25D366] px-5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1ebe5b]"
                >
                  <WhatsAppIcon className="size-5" /> Chat on WhatsApp
                </a>
              ) : (
                <Button size="lg" className="shrink-0 rounded-xl" disabled>
                  <MessageCircle /> Start live chat
                </Button>
              )
            )}
          </Card>

          {/* Other channels */}
          <div className="grid gap-4 md:grid-cols-2">
            <ChannelCard
              icon={Phone}
              tone="info"
              title="Call us"
              value={p?.support_phone}
              description="Talk to our support team directly."
              action={p?.support_phone ? { label: "Call now", href: telHref(p.support_phone) } : undefined}
            />
            <ChannelCard
              icon={WhatsAppIcon}
              tone="whatsapp"
              title="WhatsApp"
              value={p?.support_whatsapp}
              description="Send a message or a screenshot of the issue."
              action={p?.support_whatsapp ? { label: "Open WhatsApp", href: `https://wa.me/${phoneDigits(p.support_whatsapp)}`, external: true } : undefined}
            />
            <ChannelCard
              icon={Mail}
              tone="warning"
              title="Email"
              value={p?.support_email}
              description="For detailed questions — we reply within one working day."
              action={p?.support_email ? { label: "Send email", href: `mailto:${p.support_email}?subject=${encodeURIComponent("Support request")}` } : undefined}
            />
            <ChannelCard
              icon={MapPin}
              tone="brand"
              title="Office address"
              value={p?.office_address}
              description="Visit us for training or a demo."
              action={p?.office_address ? { label: "Open in Maps", href: `https://maps.google.com/?q=${encodeURIComponent(p.office_address)}`, external: true } : undefined}
              multiline
            />
          </div>

          {p?.website && (
            <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-3">
                <Globe className="size-5 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-foreground">Website</p>
                  <p className="text-sm text-muted-foreground">{p.website.replace(/^https?:\/\//, "")}</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <a href={p.website} target="_blank" rel="noopener noreferrer">
                  Visit <ExternalLink />
                </a>
              </Button>
            </Card>
          )}

          <AccountDetailsCard />
        </>
      )}
    </div>
  );
}

const TONES = {
  whatsapp: "bg-[#25D366]/12 text-[#1da851]",
  brand: "bg-brand-soft text-brand",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
} as const;

function ChannelCard({
  icon: Icon,
  tone,
  title,
  value,
  description,
  action,
  multiline,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof TONES;
  title: string;
  value: string | null | undefined;
  description: string;
  action?: { label: string; href: string; external?: boolean };
  multiline?: boolean;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {value ? (
            <p className={cn("mt-0.5 font-semibold text-foreground", multiline ? "whitespace-pre-line text-base" : "break-all text-lg")}>{value}</p>
          ) : (
            <p className="mt-0.5 text-base font-medium text-muted-foreground">Not available yet</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action && (
        <div className="mt-4 flex gap-2 border-t border-border pt-4">
          <Button asChild variant="outline" className="flex-1 rounded-xl">
            <a href={action.href} target={action.external ? "_blank" : undefined} rel={action.external ? "noopener noreferrer" : undefined}>
              {action.label}
            </a>
          </Button>
          {value && <CopyButton text={value} />}
        </div>
      )}
    </Card>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}

/** What a support agent will ask for — ready to read out or copy. */
function AccountDetailsCard() {
  const { user, config, subscription } = useAuth();
  const { typeName } = useBranding();
  const rows = [
    ["Business", config?.business?.name],
    ["Business ID", config?.business ? `#${config.business.id}` : null],
    ["Business type", typeName],
    ["Your name", user?.name],
    ["Login email", user?.email],
    ["Plan", subscription?.package?.name ? `${subscription.package.name} (${subscription.subscription?.effective_status ?? "—"})` : null],
  ].filter(([, v]) => v) as [string, string][];

  const summary = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Your account details</h2>
          <p className="text-sm text-muted-foreground">Share these when you contact support so we can help you faster.</p>
        </div>
        <CopyAllButton text={summary} />
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted/60 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-foreground" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function CopyAllButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check className="text-success" /> : <Copy />} {copied ? "Copied" : "Copy details"}
    </Button>
  );
}

/** WhatsApp glyph (lucide has no brand icons). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.31l-.35-.2-3.57.93.95-3.48-.22-.36a9.42 9.42 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.46-9.44 2.52 0 4.9.99 6.68 2.77a9.38 9.38 0 0 1 2.76 6.68c0 5.2-4.24 9.44-9.45 9.44m8.04-17.49A11.3 11.3 0 0 0 12.05.67C5.78.67.68 5.77.68 12.04c0 2 .52 3.96 1.52 5.68L.58 23.33l5.74-1.5a11.34 11.34 0 0 0 5.43 1.38h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.9-3.33-8.04" />
    </svg>
  );
}

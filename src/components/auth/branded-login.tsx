"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Eye, EyeOff, Lock, Mail, MapPin, Phone, Zap } from "lucide-react";
import { usePlatformInfo } from "@/hooks/use-platform";
import type { PlatformInfo } from "@/types";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiClientError } from "@/lib/api/client";
import { applyBrandTheme, DEFAULT_THEME, rememberLoginSlug } from "@/lib/branding";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BusinessTypeIcon } from "./business-type-icon";
import type { BusinessTypeBranding } from "@/types";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

/**
 * Split-screen sign-in. With `branding` (a business type's /login/{slug}
 * URL) the whole page — colour, headline, highlights, background photo —
 * is that trade's; without it, the neutral Universal POS look.
 */
export function BrandedLogin({ branding, isLoading = false }: { branding?: BusinessTypeBranding | null; isLoading?: boolean }) {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const theme = { ...DEFAULT_THEME, ...(branding?.theme ?? {}) };
  // The POS company itself (Super Admin → System Settings): its name, office
  // and support contacts replace the hard-coded "Universal POS" everywhere.
  const platform = usePlatformInfo().data;
  const companyName = platform?.name || "Universal POS";
  const productName = branding ? `${branding.name} POS` : companyName;

  useEffect(() => {
    if (isLoading) return;
    // Paint this trade's colour on the login page only (not persisted —
    // the signed-in business's own type decides the app's colours).
    applyBrandTheme(branding ? { primary_color: theme.primary_color, sidebar_style: theme.sidebar_style } : null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branding, isLoading]);

  useEffect(() => {
    document.title = `Sign in · ${productName}`;
  }, [productName]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      rememberLoginSlug(branding?.slug);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (Object.keys(err.errors).length > 0) {
          Object.entries(err.errors).forEach(([field, messages]) => {
            if (field === "email" || field === "password") {
              setError(field, { message: messages[0] });
            }
          });
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  const heroBackground = theme.login_image_url
    ? `linear-gradient(160deg, rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.72)), url("${theme.login_image_url}")`
    : "radial-gradient(120% 90% at 0% 0%, rgb(255 255 255 / 0.22), transparent 55%), radial-gradient(90% 80% at 100% 100%, rgb(0 0 0 / 0.35), transparent 60%)";

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* ───────── Brand panel ───────── */}
      <section
        className="relative hidden overflow-hidden bg-brand bg-cover bg-center text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
        style={{ backgroundImage: heroBackground }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border-[40px] border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            {branding ? <BusinessTypeIcon name={branding.icon} className="size-6" aria-hidden /> : <Zap className="size-6" fill="currentColor" aria-hidden />}
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">{isLoading ? " " : productName}</p>
            <p className="text-sm text-white/75">Point of sale &amp; business management</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-12 w-3/4 rounded-lg bg-white/15" />
              <div className="h-5 w-full rounded bg-white/10" />
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">{theme.login_headline}</h1>
              <p className="mt-4 text-lg text-white/85">{theme.login_tagline}</p>
              {theme.login_highlights.length > 0 && (
                <ul className="mt-8 space-y-3">
                  {theme.login_highlights.slice(0, 5).map((line) => (
                    <li key={line} className="flex items-center gap-3 text-base text-white/95">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                        <CheckCircle2 className="size-4" aria-hidden />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="relative">
          <CompanyContact platform={platform} tone="onBrand" />
          <p className="mt-4 text-sm text-white/60">Powered by {companyName}</p>
        </div>
      </section>

      {/* ───────── Form panel ───────── */}
      <section className="flex flex-col">
        {/* Mobile brand strip (the big panel is desktop-only) */}
        <div className="relative overflow-hidden bg-brand bg-cover bg-center px-6 pb-10 pt-8 text-white lg:hidden" style={{ backgroundImage: heroBackground }}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              {branding ? <BusinessTypeIcon name={branding.icon} className="size-5" aria-hidden /> : <Zap className="size-5" fill="currentColor" aria-hidden />}
            </div>
            <p className="text-base font-semibold">{productName}</p>
          </div>
          {!isLoading && <p className="mt-5 text-2xl font-bold leading-snug">{theme.login_headline}</p>}
        </div>

        <div className="flex items-center justify-end px-6 pt-5">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-4 sm:px-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Welcome back</h2>
              <div className="mt-2 text-[15px] text-muted-foreground">
                {isLoading ? <Skeleton className="h-5 w-64" /> : <>Sign in to your {branding ? branding.name.toLowerCase() : "business"} workspace.</>}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
              {serverError && <Alert variant="error">{serverError}</Alert>}

              <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <div id="email-field" className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@business.com"
                    className="h-12 pl-11 text-[15px]"
                    error={!!errors.email}
                    {...register("email")}
                  />
                </div>
              </Field>

              <Field label="Password" htmlFor="password" error={errors.password?.message}>
                <div id="password-field" className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-12 pl-11 pr-12 text-[15px]"
                    error={!!errors.password}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                  </button>
                </div>
              </Field>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" size="lg" loading={isSubmitting} className="h-12 w-full rounded-xl text-base font-semibold">
                Sign in
              </Button>
            </form>

            <div className="mt-10 border-t border-border pt-6 lg:hidden">
              <CompanyContact platform={platform} tone="muted" />
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} {companyName} · Secure sign-in
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/** The POS company's office address, phone and email — whichever the Super Admin has filled in. */
function CompanyContact({ platform, tone }: { platform: PlatformInfo | undefined; tone: "onBrand" | "muted" }) {
  if (!platform) return null;
  const rows = [
    platform.office_address && { icon: MapPin, text: platform.office_address, href: `https://maps.google.com/?q=${encodeURIComponent(platform.office_address)}` },
    platform.support_phone && { icon: Phone, text: platform.support_phone, href: `tel:${platform.support_phone.replace(/[^\d+]/g, "")}` },
    platform.support_email && { icon: Mail, text: platform.support_email, href: `mailto:${platform.support_email}` },
  ].filter(Boolean) as { icon: typeof MapPin; text: string; href: string }[];

  if (rows.length === 0) return null;
  const onBrand = tone === "onBrand";

  return (
    <div className={onBrand ? "max-w-md rounded-2xl bg-black/15 p-4 ring-1 ring-white/15 backdrop-blur-sm" : "space-y-1"}>
      <p className={onBrand ? "mb-2 text-xs font-semibold uppercase tracking-wider text-white/70" : "mb-1 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"}>
        Need help? Contact {platform.name}
      </p>
      <ul className={onBrand ? "space-y-1.5" : "flex flex-col items-center gap-1"}>
        {rows.map(({ icon: Icon, text, href }) => (
          <li key={text}>
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={
                onBrand
                  ? "flex items-start gap-2.5 text-sm text-white/90 hover:text-white hover:underline"
                  : "flex items-start gap-2 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              <Icon className={onBrand ? "mt-0.5 size-4 shrink-0 text-white/70" : "mt-0.5 size-3.5 shrink-0"} aria-hidden />
              <span className="break-words">{text}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

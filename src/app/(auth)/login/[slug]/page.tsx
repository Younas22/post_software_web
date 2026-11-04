"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BrandedLogin } from "@/components/auth/branded-login";
import { brandingService } from "@/services/branding.service";

/**
 * A business type's own login URL — e.g. /login/restaurant or
 * /login/dental-clinic — themed with that type's colours and login copy
 * (Admin → Business Types). An unknown slug falls back to the neutral page.
 */
export default function BusinessTypeLoginPage() {
  const { slug } = useParams<{ slug: string }>();

  const branding = useQuery({
    queryKey: ["public-branding", slug],
    queryFn: () => brandingService.get(slug),
    enabled: !!slug,
    retry: false,
    staleTime: 5 * 60_000,
  });

  return <BrandedLogin branding={branding.data ?? null} isLoading={branding.isLoading} />;
}

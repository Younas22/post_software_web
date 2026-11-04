"use client";

import { BrandedLogin } from "@/components/auth/branded-login";

/** The neutral Universal POS sign-in. Each business type also has its own branded URL: /login/{slug}. */
export default function LoginPage() {
  return <BrandedLogin />;
}

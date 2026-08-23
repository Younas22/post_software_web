import { z } from "zod";

/**
 * Mirrors the backend's actual password policy exactly
 * (AppServiceProvider::boot() → Password::min(10)->mixedCase()->numbers()->symbols())
 * so the form rejects a weak password immediately instead of round-tripping
 * a 422 the user has to decode. Keep in sync if that policy ever changes.
 */
export const passwordSchema = z
  .string()
  .min(10, "Must be at least 10 characters")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[0-9]/, "Must include a number")
  .regex(/[^A-Za-z0-9]/, "Must include a symbol");

/** Same policy, but optional/blank-allowed — for "leave blank to keep current" fields. */
export const optionalPasswordSchema = z.union([passwordSchema, z.literal("")]).optional();
